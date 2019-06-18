const generate = (maxColor, latestColor) => {
    let svg = `<svg
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:cc="http://creativecommons.org/ns#"
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        id="svg8"
        version="1.1"
        viewBox="0 0 84.688354 84.688354"
        height="84.688354"
        width="84.688354">
        <defs id="defs2" />
        <g transform="translate(-61.786713,-90.408127)" id="layer1">
            <path
                style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${maxColor};stroke-width:0.26458332"
                d="m 104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.671133,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.671133,-21.172093 l 0,42.344173 z"
                id="path3729"/>
            <path
                transform="scale(-1,1)"
                style=";stroke-width:0.26458332;stroke:#000000;stroke-opacity:1;fill:${latestColor};stroke-width:0.26458332"
                d="m -104.13089,175.09648 a 42.344177,42.344177 0 0 1 -36.67113,-21.17209 42.344177,42.344177 0 0 1 0,-42.34417 42.344177,42.344177 0 0 1 36.67113,-21.172093 l 0,42.344173 z"
                id="path3729-3"/>
        </g>
    </svg>`;

    return 'data:image/svg+xml;base64,' + btoa(svg);
};

module.exports = { generate };