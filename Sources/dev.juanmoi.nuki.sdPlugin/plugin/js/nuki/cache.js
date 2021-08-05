// Protoype for a data cache
function Cache() {
    // Init Cache
    var instance = this;

    // Refresh time of the cache  in seconds
    var autoRefreshTime = 60;

    // Private timer instance
    var timer = null;

    // Private bridge discovery
    var discovery = null;

    // Public variable containing the cached data
    this.data = {};

    // Public function to start polling
    this.startPolling = function() {
        // Log to the global log file
        log('Start polling to create cache');

        // Start a timer
        instance.refresh();
        timer = setInterval(instance.refresh, autoRefreshTime * 1000);
    }

    // Public function to stop polling
    this.stopPolling = function() {
        // Log to the global log file
        log('Stop polling to create cache');

        // Invalidate the timer
        clearInterval(timer);
        timer = null;
    }

    // Private function to discover all bridges on the network
    function buildDiscovery(inCallback) {
        // Check if discovery ran already
        if (discovery != null) {
            inCallback(true);
            return;
        }

        // Init discovery variable to indicate that it ran already
        discovery = {};

        // Run discovery
        Bridge.discover(function(inSuccess, inBridges) {
            // If the discovery was not successful
            if (!inSuccess) {
                log(inBridges);
                inCallback(false);
                return;
            }

            // For all discovered bridges
            inBridges.forEach(function(bridge) {
                // Add new bridge to discovery object
                discovery[bridge.getBridgeId()] = {
                    bridgeId: bridge.getBridgeId(),
                    ip: bridge.getIP(),
                    port: bridge.getPort(),
                    dateUpdated: bridge.getDateUpdated(),
                    token: bridge.getToken(),
                }
            });

            inCallback(true);
        });
    }

    // Private function to build a cache
    this.refresh = function() {
        // Build discovery if necessary
        buildDiscovery(function(inSuccess) {
            // If discovery was not successful
            if (!inSuccess) {
                log("API request fails.");
                return;
            }

            // If no devices is paired
            if (globalSettings.devices === undefined) {
                log("No devices detected in global settings.");
                return;
            }

            // Iterate through all bridges that were discovered
            Object.keys(discovery).forEach(function(inBridgeID) {
                // If the discovered bridge is not paired
                var locks = globalSettings.devices.locks || [];
                var openers = globalSettings.devices.openers || [];

                var compareId = function(device) {
                    var bridgeId = device.bridge.bridgeId;
                    return bridgeId === inBridgeID;
                }

                var bridgePaired = !!locks.filter(compareId.bind(this)) || !!openers.filter(compareId.bind(this));

                if (!bridgePaired) {
                    return;
                }

                // Create a bridge instance
                var bridge = discovery[inBridgeID];

                var compareIpAndPort = function(device) {
                    var deviceBridge = device.bridge
                    var bridgeIp = deviceBridge.ip;
                    var bridgePort = deviceBridge.port;

                    return (bridge.ip !== bridgeIp) || (bridge.port !== bridgePort)
                }

                var hasDifferentIpOrPort =
                    !!locks.filter(compareIpAndPort.bind(this)).length || !!openers.filter(compareIpAndPort.bind(this)).length;
                
                if (!hasDifferentIpOrPort) {
                    // If there is data in cache
                    if (Object.keys(instance.data).length === 0) {
                        var devicesCache = {
                            locks,
                            openers
                        };
        
                        instance.data = devicesCache;

                        // Inform keys that updated cache is available
                        var event = new CustomEvent('newCacheAvailable');
                        document.dispatchEvent(event);
                    }
                    return;
                }

                var setNewestBridge = function(device) {
                    var bridgeId = device.bridge.bridgeId;

                    if(bridgeId === bridge.id) {
                        bridge.token = device.bridge.token;

                        var newBridge = { 
                            token: bridge.getToken(),
                            bridgeId: bridge.getBridgeId(),
                            ip: bridge.getIP(),
                            port: bridge.getPort(),
                            dateUpdated: bridge.getDateUpdated(),
                        };

                        device.bridge = newBridge;
                    }

                    return device;
                }

                var locksWithNewestBridge = locks.map(setNewestBridge.bind(this));

                var openersWithNewestBridge = openers.map(setNewestBridge.bind(this));

                var devicesCache = {
                    locks: locksWithNewestBridge,
                    openers: openersWithNewestBridge
                };

                instance.data = devicesCache;

                // Inform keys that updated cache is available
                var event = new CustomEvent('newCacheAvailable');
                document.dispatchEvent(event);
            });
        });
    };
}