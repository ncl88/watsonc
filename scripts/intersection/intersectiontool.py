# -*- coding: utf-8 -*-
"""
Created on Tue May 14 2019
@author: https://github.com/mapcentia
"""

import os
from pprint import pprint
import shapefile
import psycopg2
import pandas.io.sql as sqlio
from shapely.geometry import Point, LineString, Polygon, shape
import pandas as pd
import json
import sys
from pyproj import Proj, transform

LOG = False

def transformPoint(x, y):
    inProj = Proj(init='epsg:25832')
    outProj = Proj(init='epsg:4326')
    x2, y2 = transform(inProj, outProj, x, y)
    return x2, y2

def getCoordinatesFromString(l):
    lineCoordinatesRaw = l.split(", ")
    coordinates = []
    for c in lineCoordinatesRaw:
        splitCoordinates = c.split(" ")
        coordinates.append((float(splitCoordinates[0]), float(splitCoordinates[1])))
    return coordinates

def getStationingPoints(inputLine, modelPoly):
    pkter = inputLine.coords
    if inputLine.intersects(modelPoly):
        polyStr = str(modelPoly)
        polyStr = polyStr.replace("POLYGON ((", "")
        polyStr = polyStr.replace("))", "")
        polyStrSplit = polyStr.split(", ")

        polyCoords = []
        for coordPair in polyStrSplit:
            splitPair = coordPair.split(" ")
            polyCoords.append([float(splitPair[0]), float(splitPair[1])])

        lineStartIsInsideOfThePolygon = False
        firstPoint = Point(pkter[0])
        if modelPoly.contains(firstPoint):
            lineStartIsInsideOfThePolygon = True

        if LOG:
            pprint("Line starts inside of the polygon: " + str(lineStartIsInsideOfThePolygon))

        segmentStartInside = lineStartIsInsideOfThePolygon
        absoluteSum = 0
        insideSum = 0

        intersectionSegments = []
        i = 0
        while i < len(pkter):
            # Iterating over line vertices
            if i > 0:
                if LOG:
                    pprint("Profile segment " + str(i))
                    print("insideSum " + str(insideSum))
                    print("absoluteSum " + str(absoluteSum))

                profileSegment = LineString([pkter[i - 1], pkter[i]])

                previousPoint = Point(pkter[i - 1])
                currentPoint = Point(pkter[i])
                segmentStartInside = modelPoly.contains(previousPoint)
                segmentEndInside = modelPoly.contains(currentPoint)

                additionalIntersection = profileSegment.intersection(modelPoly)
                if additionalIntersection.wkt != "GEOMETRYCOLLECTION EMPTY":
                    if additionalIntersection.wkt.startswith("MULTILINESTRING (("):
                        lineRaw = additionalIntersection.wkt.replace("MULTILINESTRING ((", "").replace("))", "")
                        lineSplit = lineRaw.split("), (")
                    elif additionalIntersection.wkt.startswith("LINESTRING ("):
                        lineSplit = [additionalIntersection.wkt.replace("LINESTRING (", "").replace(")", "")]
                    else:
                        raise Exception("Unexpected intersection format: " + additionalIntersection.wkt)

                    numberOfIntersectingLines = len(lineSplit)

                    if LOG:
                        print("Line segment " + str(i) + " intersects polygon via " + str(numberOfIntersectingLines) + " lines")

                    """
                    if there is a one intersection
                        if start inside and end inside
                            if i-1 is first line point, add intersectionLength to insideSum
                            if i is last line point, add segment with intersectionLength and insideSum (-<)
                            if i is not last line point, add intersectionLength to insideSum
                        if start inside and end outside
                            add segment with intersectionLength and insideSum (-<)
                        if start outside and end inside
                            if i is last line point, add segment with intersectionLength and insideSum (>-<)
                            if i is not last line point, add intersectionLength to insideSum
                        if start outside and end outside
                            add segment with intersectionLength (>-<)
                    if there is more than one intersection
                        iterate over interesections
                            if segment starts inside
                                process first intersection
                                    iadd segment with intersectionLength and insideSum (-<)
                                process between intersection
                                    add segment with intersectionLength (>-<)
                                process last intersection
                                    if segment finishes outside
                                        add segment with intersectionLength (>-<)
                                    if segment finishes inside
                                        if is last line point, add segment with intersectionLength (>-<)
                                        if is not last line point, add intersectionLength to insideSum
                            if segment starts outside
                                process non-last intersection
                                    add segment with intersectionLength (>-<)
                                process last intersection
                                    if segment finishes outside
                                        add segment with intersectionLength (>-<)
                                    if segment finishes inside
                                        if is last line point, add segment with intersectionLength (>-<)
                                        if is not last line point, add intersectionLength to insideSum
                    """

                    if len(lineSplit) == 1:
                        coordinates = getCoordinatesFromString(lineSplit[0])

                        intersection = LineString([coordinates[0], coordinates[1]])
                        tmpProfileSegment1 = LineString([pkter[i - 1], coordinates[0]])
                        tmpProfileSegment2 = LineString([pkter[i - 1], coordinates[1]])

                        if segmentStartInside == True:
                            if segmentEndInside == True:
                                if i == 1:
                                    insideSum += intersection.length
                                if i == (len(pkter) - 1):
                                    intersectionSegments.append((round(absoluteSum - insideSum), round(absoluteSum + intersection.length)))
                                    insideSum = 0
                                if i != 1 and i != (len(pkter) - 1):
                                    insideSum += intersection.length
                            elif segmentEndInside == False:
                                intersectionSegments.append((round(absoluteSum - insideSum), round(absoluteSum + intersection.length)))
                                insideSum = 0
                        elif segmentStartInside == False:
                            if segmentEndInside == True:
                                if i == (len(pkter) - 1):
                                    intersectionSegments.append((round(absoluteSum - insideSum), round(absoluteSum + intersection.length)))
                                    insideSum = 0
                                else:
                                    insideSum += intersection.length
                            if segmentEndInside == False:
                                intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                insideSum = 0
                    elif len(lineSplit) > 1:
                        counter = 0
                        for l in lineSplit:
                            coordinates = getCoordinatesFromString(l)

                            intersection = LineString([coordinates[0], coordinates[1]])
                            tmpProfileSegment1 = LineString([pkter[i - 1], coordinates[0]])
                            tmpProfileSegment2 = LineString([pkter[i - 1], coordinates[1]])

                            if segmentStartInside == True:
                                if counter == 0:
                                    intersectionSegments.append((round(absoluteSum - insideSum), round(absoluteSum + tmpProfileSegment2.length)))
                                    insideSum = 0
                                elif counter == (len(lineSplit) - 1):
                                    if segmentEndInside == True:
                                        if i == (len(pkter) - 1):
                                            intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                        else:
                                            insideSum += intersection.length
                                    else: 
                                        intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                else:
                                    intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                            else:
                                if counter < (len(lineSplit) - 1):
                                    intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                else:
                                    if segmentEndInside == False:
                                        intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                    else:
                                        if i == (len(pkter) - 1):
                                            intersectionSegments.append((round(absoluteSum + tmpProfileSegment1.length), round(absoluteSum + tmpProfileSegment2.length)))
                                        else:
                                            insideSum += intersection.length
                            counter += 1

                absoluteSum += profileSegment.length
            i += 1
        return intersectionSegments
    else:
        # Line is completely inside of the polygon
        firstPoint = Point(pkter[0])
        if modelPoly.contains(firstPoint):
            return [(0, inputLine.length)]
        else:
            return []

if __name__ == "__main__":
    inputdata = json.loads(sys.argv[1])

    result = []
    
    # Scan folder for configurations
    configFiles = [];
    localDataFolder = inputdata['configFolder']
    if os.path.isdir(localDataFolder):
        for file in os.listdir(localDataFolder):
            if file.endswith("_config.txt"):
                configFiles.append(os.path.join(localDataFolder, file))
    else:
        raise Exception("Provided folder " + localDataFolder + " does not exist")

    # Select configurations with existing dataextend properties
    processedConfigurationFiles = []
    for x in configFiles:
        processedConfigurationFile = {}
        configurationFile = open(x, "r")
        configurationFile = configurationFile.readlines()
        for line in configurationFile:
            lineSplit = line.split(":")
            if len(lineSplit) == 2:
                lineSplit[0] = lineSplit[0].strip()
                lineSplit[1] = lineSplit[1].strip()
                processedConfigurationFile[lineSplit[0]] = lineSplit[1]
        processedConfigurationFile['config'] = x
        processedConfigurationFiles.append(processedConfigurationFile);

    # Check for intersection of provided line with found model polygons
    pkter = inputdata['coordinates']
    inputLine = LineString(pkter)

    currentPolygon = 0
    intersectingModels = []
    for x in processedConfigurationFiles:
        for key, value in x.items():
            if key == "Dataextend":
                if LOG:
                    pprint("Polygon " + str(currentPolygon))

                localShape = shapefile.Reader(os.path.join(localDataFolder, value))
                feature = localShape.shapeRecords()[0]
                firstModelPolygon = feature.shape.__geo_interface__
                modelPoly = shape(firstModelPolygon)

                intersectionSegments = getStationingPoints(inputLine, modelPoly)
                if len(intersectionSegments) != 0:
                    localResult = {}
                    localResult['title'] = x['Title']
                    localResult['subtitle'] = x['Subtitle']
                    localResult['type'] = x['Type (geology, terrain, potential)']
                    localResult['layerinfo'] = x['layerinfo']
                    localResult['layerconfig'] = x['config']
                    localResult['intersectionSegments'] = intersectionSegments
                    intersectingModels.append(localResult)
                currentPolygon += 1

    print(json.dumps(intersectingModels))
    