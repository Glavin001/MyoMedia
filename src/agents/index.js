'use strict';
module.exports = (function() {
    // let agentsNames = ['moviedb','tvdb'];
    // return agentsNames.map(function(agentName) {
    //     return require(`./${agentName}`);
    // });
    return {
        'moviedb': require('./moviedb'),
        'tvdb': require('./tvdb')
    };
})();