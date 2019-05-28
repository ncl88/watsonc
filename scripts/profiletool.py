# -*- coding: utf-8 -*-
"""
Created on Tue Apr 16 10:33:51 2019
@author: NielsClaes, OleMunchJohansen

"""
#import pandas as pd
import numpy as np
#import time
import psycopg2
import pandas.io.sql as sqlio
#    import geopandas as gpd
from shapely.geometry import Point, LineString
#from scipy import interpolate
#from plotly.offline import plot
import plotly.graph_objs as go
import math
import plotly
import pandas as pd
#import os 
import json
import sys

#json_str = '{"coordinates": [[565977, 6372779], [567447, 6370030], [569000, 6369000]], "DGU_nr": ["  6.   37A", "  6.   37B", "  6.   64B", "  6.  413", "  6.   64A", "  6.  414", "  6.  835", "  6.  412", "  6.  783", "  6.  751", "  6.  931", "  6.  954", "  6.  955"], "Profile_depth": -80}'



def profiletool_v4(json_str): ##Json string med coordinates DGU_nr Profile_depth
    inputdata = json.loads(json_str)

     
    pkter = inputdata['coordinates']
        
    data = np.load('FOHM_layers_v2.npy')
    
    
    cellsize = 100 
    ulx = 438450.0
    uly = 6413550.0 
    

    
    Line_in=LineString(pkter)
    x_coo,y_coo=Line_in.xy    
    # length of each section and the calculation of what part of the total length it constitutes
        
    total_length=Line_in.length  
    
    length=[]
    andel=[]
    
    
    for i in range(0,(len(x_coo))-1):
        pt1=Point(pkter[i])
        pt2=Point(pkter[i+1])
        l=pt1.distance(pt2)
        length.append(l)
        andel.append(l/total_length)
    
    
    # interpolate n points between two coordinates where n is andel*total points on the graph
    
    n=[]
    total_points=np.int(total_length/33)
    if total_points>1000:
            total_points = 1000
            
    x_interp=[]
    y_interp=[]
    
    
    for i in range(0,len(andel)):
        inter=np.ceil(andel[i]*total_points)
        n.append(inter)
        
        transect=LineString([(x_coo[i],y_coo[i]),(x_coo[i+1],y_coo[i+1])])
        x_interp.append(x_coo[i])
        y_interp.append(y_coo[i])                    
            
        for j in range(0,(int(n[i]))):
            delta=1/n[i]
            r=transect.interpolate((j+1)*delta,normalized=True)
            x_interp.append(r.x)    #x coo af punktet på linje
            y_interp.append(r.y)    #y coo af punktet på linje
            
    #afstand fra starten af linjen
    
    x_profile=[]
    x_profile.append(np.sqrt(np.square(x_coo[0]-x_interp[0])+np.square(y_coo[0]-y_interp[0]))) 
    
    for i in range(0,len(x_interp)-1):
        short=np.sqrt(np.square(x_interp[i+1]-x_interp[i])+np.square(y_interp[i+1]-y_interp[i]))
        x_profile.append(x_profile[i]+short)
    
    
    
    n_points = np.size(x_interp)
    #
    
    values=np.zeros((n_points,46),dtype=np.float16) 
    
    
        
    for n in range(n_points):
        #ip = (x[0]+n*stepx-ulx)/cellsize  # x[0]+n*stepx-ulx : x vaerdie på linje
        ip = (x_interp[n]-ulx)/cellsize
        #jp = (uly-(y[0]+n*stepy))/cellsize # uly-(y[0]+n*stepy) : y vaerdie på linje
        jp = (uly-y_interp[n])/cellsize 
     
        if total_length/(n_points-1) < math.sqrt(cellsize*cellsize):    # diagonal af cellen istedet for cellsize   
            # find j,i for 4 cells that goes into interpolation
            
            i1 = np.int(ip+0.5)
            j1 = np.int(jp+0.5)
            
            i2 = np.int(ip+0.5)
            j2 = np.int(jp-0.5)
            
            i3 = np.int(ip-0.5)
            j3 = np.int(jp+0.5)
            
            i4 = np.int(ip-0.5)
            j4 = np.int(jp-0.5)
        
    
            # calc weigths for interpolation
    
            a=(ip-int(ip))
            b=(jp-int(jp))
            
            if (a<0.5 and b<0.5): #Hvis punkt i felt 1 (nedre højre firkant)
                w1 = (0.5+a)*(0.5+b)
                w2 = (0.5+a)*(0.5-b)
                w3 = (0.5-a)*(0.5+b)
                w4 = (0.5-a)*(0.5-b)
                
            if (a>0.5 and b<0.5): #Hvis punkt i felt 3 (nedre venstre firkant)
                w1 = (a-0.5)*(0.5+b)
                w2 = (a-0.5)*(0.5-b)
                w3 = (1.5-a)*(0.5+b)
                w4 = (1.5-a)*(0.5-b)
                
            if (a<0.5 and b>0.5): #Hvis punkt i felt 2 (øvre højre firkant)
                w1 = (0.5+a)*(b-0.5)
                w2 = (0.5+a)*(1.5-b)
                w3 = (0.5-a)*(b-0.5)
                w4 = (0.5-a)*(1.5-b)
                
            if (a>0.5 and b>0.5): #Hvis punkt i felt 4 (øvre venstre firkant)
                w1 = (a-0.5)*(b-0.5)
                w2 = (a-0.5)*(1.5-b)
                w3 = (1.5-a)*(b-0.5)
                w4 = (1.5-a)*(1.5-b)
        
            for i in range(45):
                # for all layers calculate interpolated value
                values[n,i]=((w1*data[j1,i1,i]+w2*data[j2,i2,i]+w3*data[j3,i3,i]+w4*data[j4,i4,i])/(w1+w2+w3+w4))
        
        else:
            for i in range(45):
                # for all layers extract value in cell
                values[n,i]=(data[np.int(jp),np.int(ip),i])
    
    #plt.plot(np.linspace(0, length, n_points, endpoint=True),values,'g.-')
    #plt.show()
    
    inventory = pd.read_csv('inventory.txt',sep=';')
    #inventory = inventory.drop('navn',1)
    
    
    plot_data=pd.DataFrame()
    plot_data['x']=x_profile
    plot_data['top']=values[:,0]
    
    legend_list=[]
       # f=open('legend.txt', 'w',encoding='utf-8')
    legend_list.append(inventory['legend'][0])

    
    b=0
    farve=[]
    for i in range(1,(np.shape(values)[1])): #1 to 0
        tyk = values[:,i]-values[:,i-1]
        if min(tyk) < -0.5:
            b=b+1
            navn = 'bund'+str(b)
            plot_data[navn]=values[:,i]
            legend_list.append(inventory['legend'][i])

            farve.append(inventory['farve'][i])

    
    afarve=[]
    test1=[]
    
    for i in range(0,len(farve)):
        test=farve[i][4:int(len(farve[i])-1)].split(',')
        test1.append(test)
        line=str('rgba('+test[0]+','+test[1]+','+test[2]+',0.9)')
        afarve.append(line)

    
    
    Topo = plot_data
    laglist=legend_list
    
    data=[]
    
    trace = go.Scatter(
        x = Topo.x.tolist(),
        y = Topo.iloc[:, 1].tolist() ,
        line = dict(
        color = ('rgb(0, 0, 0)'),
        width = 3,
        dash = 'dash'),
    
        #
    #    fill='tonexty',
    #    fillcolor='rgba(147,69,1,1)',
        opacity = 1.0,
     
        )
    data.append(trace)
    
    
    y_max=max(Topo.iloc[:, 1].tolist())
    
    for l in range(0,len(Topo.columns)-2):

        
    
        trace = go.Scatter(x = Topo.x.tolist() , y = Topo.iloc[:, l+2].tolist()  , line = dict(color = (farve[l]), width = 2), fill='tonexty', fillcolor = afarve[l], hoverinfo=None)
        data.append(trace)
        
            

    for l in range(len(Topo.columns),1,-1):
        
        trace = go.Scatter(x = Topo.x.tolist() , y = Topo.iloc[:, l-1].tolist()  , line = dict(color = (farve[l-3]), width = 2), name=laglist[l-2], hoverinfo='name' )
        data.append(trace)
      
    
    trace = go.Scatter(
        x = Topo.x.tolist(),
        y = Topo.iloc[:, 1].tolist() ,
        line = dict(
        color = ('rgb(0, 0, 0)'),
        width = 3,
        dash = 'dash'),
    
        #
    #    fill='tonexty',
    #    fillcolor='rgba(147,69,1,1)',
        opacity = 1.0,
        name='terræn',
        hoverinfo= 'name',
        )
    data.append(trace)
    
    
    
    layout = go.Layout(
                            showlegend=False,
                            #annotations = annotations,
                            hovermode = 'closest',
                            xaxis=dict( title='Afstand [m]', ticklen=5,
                                zeroline=False,
                                gridwidth=2),
                            yaxis=dict(
                                title='Kote [m]',
                                ticklen=5,
                                gridwidth=2,
                                range=[-100,y_max+10]), 
                            yaxis2=dict(title='Kote [m]',
                                ticklen=5,
                                gridwidth=2, 
                                overlaying='y',
                                range=[-100,y_max+10]),
                            hoverlabel=dict(namelength=100)
                                        
                            )
    
    #################################################### 
    #### Boringer
    ####################################################
    ## Connect to GC2
    
    
    Color = pd.read_csv('RockSymbol_color_code.csv',sep='\t',encoding = 'utf-8')
    Color = Color.set_index('symbol')
    
    
    try:
        conn = psycopg2.connect(dbname="jupiter", user="gc2", password="wBx6nZCE", host="watsonc.mapcentia.com")
    except:
        print ("I am unable to connect to the database")
        #sys.exit() 
    
    
    line = Line_in #gpd.read_file("Astrup_NS.shp") #profil linje
    
## HENT LISTE OVER DGU BORINGER

    DGU=inputdata['DGU_nr']
        
    txt="("
    for count, i in enumerate(DGU):
        if count < (len(DGU)-1):
            txt=txt+"'"+i+"',"
        else:
            txt=txt+"'"+i+"')"
       
    
    #for i in DGU:
    # data_position: boringsplacering + filter
        #data_litho: lithologi som skal med på profilen
        
    data_position = sqlio.read_sql_query("SELECT borehole.boreholeno, borehole.xutm, borehole.yutm, borehole.elevation, screen.intakeno, screen.top, screen.bottom, screen.screenno FROM pcjupiterxlplus.borehole Inner Join pcjupiterxlplus.screen ON borehole.boreholeno=screen.boreholeno WHERE borehole.boreholeno in"+txt ,conn)
    data_litho = sqlio.read_sql_query("SELECT lithsamp.boreholeno, lithsamp.top, lithsamp.bottom, lithsamp.rocksymbol FROM pcjupiterxlplus.lithsamp WHERE lithsamp.boreholeno in"+txt ,conn)
    
    ## find placering på profilen
    
    
    #dist=[]
    
    annotations =[]
    DGU2=np.intersect1d(data_litho['boreholeno'],data_position['boreholeno'])
    for i in DGU2:
        x = data_position.loc[data_position['boreholeno'] == i].xutm.unique()
        y = data_position.loc[data_position['boreholeno'] == i].yutm.unique()
    
        p2=Point(x,y)
        inters=line.interpolate(line.project(p2))
#        x_proj=inters.coords[0][0]
#        y_proj=inters.coords[0][1]
        
         #Beregning af afstand fra start fra linjen til hvor boringen skal sættes på profilen
        
        pts=line.coords
        d=0 #x afstand på profilen
        j=0
        L=LineString([pts[j],pts[j+1]])
        pt=inters
        while (L.distance(pt)>1.00e-4):
            pt1=Point(pts[j])
            pt2=Point(pts[j+1])
            d=d+pt1.distance(pt2)
            j=j+1
            L=LineString([pts[j],pts[j+1]])
        
        pt1=Point(pts[j])
        d=d+pt1.distance(pt) #x afstand på profilen
    #    dist.append(d)
        
       
        
        litho = data_litho.loc[data_litho['boreholeno'] == i].sort_values(by=['top']).reset_index()
        lag=np.zeros(len(litho))
        for k in range(0,(len(litho)-1)):
            if (litho['rocksymbol'][k]==litho['rocksymbol'][k+1]):
                lag[k+1]=lag[k]
            else: 
                lag[k+1]=lag[k]+1
        litho['lag']=lag.tolist()
        
        bars = litho['lag'].unique()
        
        bar_width = total_length/100
    #    y_l=[]
    #    y_b=[]
    #    nr=[]
    #    afsta=[]
    #    ## optegne boringer
        for row in bars:   
        
                    trace = go.Bar(
                            x = [d],
                            y = [-min(litho.loc[litho['lag']==row].top.unique())+max(litho.loc[litho['lag']==row].bottom.unique())],
                            opacity = 1.0,
                            base = [data_position.loc[data_position['boreholeno'] == i].elevation.unique()[0]-max(litho.loc[litho['lag']==row].bottom.unique())],
                            text =str(round(data_position.loc[data_position['boreholeno'] == i].elevation.unique()[0]-max(litho.loc[litho['lag']==row].bottom.unique()),1))+'(bund, kote)<br>'+litho.loc[litho['lag']==row].rocksymbol.unique()[0] +', '+ Color.tekst[litho.loc[litho['lag']==row].rocksymbol.unique()[0]],
                            #hoverinfo = 'none',
                            width = bar_width,
                            #base = [data_position.loc[data_position['boreholeno'] == i].elevation.unique()[0]-max(litho.loc[litho['lag']==row].bottom.unique())],
                            hoverinfo ='text',
                            marker = dict(color = Color.rgba[litho.loc[litho['lag']==row].rocksymbol.unique()[0]],line = dict(color = 'rgb(0, 0, 0)',width = 1)),
                            name = litho.loc[litho['lag']==row].rocksymbol.unique()[0],
                            yaxis='y2'
                            )
                    data.append(trace)            
                    
        
        annotations_ny=[dict(
            x=d,
            y=data_position.loc[data_position['boreholeno'] == i].elevation.unique()[0],
            xref='x',
            yref='y',
            text=i.replace(" ",""), #fjerne mellemrum fra dgunr
            showarrow=True,
            arrowhead=3,
            ax=0,
            ay=-50,
            textangle=-90,
            )]
                            
        annotations.extend(annotations_ny)
                    
        
        ## optegne af filtre 
        
        screen = data_position.loc[data_position['boreholeno'] == i].screenno.unique()   
        if screen.size: #hvis der er filteroplysninger om boringen
            screens = data_position.loc[data_position['boreholeno'] == i].sort_values(by=['top']).reset_index()
            for scr in range(len(screen)):
                trace = go.Bar(
                            x = [d],
                            y = [screens['bottom'][scr]-screens['top'][scr]],
                            opacity = 1.0,
                            #text =litho.loc[litho['lag']==row].rocksymbol.unique()[0] +', '+ Color.Tekst[litho.loc[litho['lag']==row].rocksymbol.unique()[0]],
                            #hoverinfo ='text+y',
                            hoverinfo = 'none',
                            width = bar_width/2,
                            base = [data_position.loc[data_position['boreholeno'] == i].elevation.unique()[0]-screens['bottom'][scr]],
                            marker = dict(
                                color = 'rgb(0,0,0)', 
                                ),
                            name = 'filter',
                            yaxis='y2'
                            )       
                data.append(trace)
    #  
                
    ## get profile depth from inputdata
    y_min = inputdata['Profile_depth'] 
          
    layout = go.Layout(
                            showlegend=False,
                            annotations = annotations,
                            hovermode = 'closest',
                            xaxis=dict( title='Afstand [m]', ticklen=5,
                                zeroline=False,
                                gridwidth=2),
                            yaxis=dict(
                                title='Kote [m]',
                                ticklen=5,
                                gridwidth=2,
                                range=[y_min,y_max+10]),
                            yaxis2=dict(title='Kote [m]',
                                ticklen=5,
                                gridwidth=2, 
                                overlaying='y',
                                range=[y_min,y_max+10]),
                             barmode='stack', #til at få alle bars ovenpå hinanden
                             hoverlabel=dict(namelength=100) #længde af labels
    
                            )
#        
    fig = go.Figure(data=data,layout=layout)
#    f_name = 'test2.html' #navn + '_500m.html'
#    plot(fig,auto_open=True,filename=f_name)
    
    #end = time.time()
    
    #print(end-start)
    JSON_data = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    #JSON_data = json.dumps(data, cls=plotly.utils.PlotlyJSONEncoder)
    
    #JSON_data = JSON_data.replace('\\u00a0',' ').replace('\\u00e6','æ').replace('\\u00F8','ø').replace('\\u00E5','å')
    print(JSON_data)

if __name__ == "__main__":
    json_str = sys.argv[1]
    json_str=json_str.replace("'",'"')
    profiletool_v4(json_str)
    #print(sys.argv[1])

####################
#### EKSEMPEL ######
####################
    
    
    
#call from console 
#profiletool_v4('{"coordinates": [[565977, 6372779], [567447, 6370030], [569000, 6369000]], "DGU_nr": ["  6.   37A", "  6.   37B", "  6.   64B", "  6.  413", "  6.   64A", "  6.  414", "  6.  835", "  6.  412", "  6.  783", "  6.  751", "  6.  931", "  6.  954", "  6.  955"], "Profile_depth": -80}')
#profiletool_v4()
# call from promt
#python profiletool_v4.py "{'coordinates': [[565977, 6372779], [567447, 6370030], [569000, 6369000]], 'DGU_nr': ['  6.   37A', '  6.   37B', '  6.   64B', '  6.  413', '  6.   64A', '  6.  414', '  6.  835', '  6.  412', '  6.  783', '  6.  751', '  6.  931', '  6.  954', '  6.  955'], 'Profile_depth': -80}"
