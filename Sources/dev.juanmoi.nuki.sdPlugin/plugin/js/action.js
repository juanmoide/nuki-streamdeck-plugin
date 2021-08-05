function Action(inContext, inSettings) {
    // Init Action
    var instance = this;

    // Private variable containing the context of the action
    var context = inContext;

    // Private variable containing the settings of the action
    var settings = inSettings;

    // Set the default values
    setDefaults();

    // Public function returning the context
    this.getContext = function() {
        return context;
    };

    // Public function returning the settings
    this.getSettings = function() {
        return settings;
    };

    // Public function for settings the settings
    this.setSettings = function(inSettings) {
        settings = inSettings;
    };

    // Public function called when new cache is available
    this.newCacheAvailable = function(inCallback) {
        // Set default settings
        setDefaults(inCallback);
    };

    // Private function to set the defaults
    function setDefaults(inCallback) {
        // If at least one bridge is paired
        if (!(Object.keys(cache.data).length > 0)) {
            // If a callback function was given
            if (inCallback !== undefined) {
                // Execute the callback function
                inCallback();
            }
            return;
        }

        // Find out type of action
        var action;
        if (instance instanceof LockAction) {
            action = 'dev.juanmoi.nuki.lock';
        }

        // If no bridge is set for this action
        if (!('device' in settings)) {

            var deviceData;
            if (instance instanceof LockAction) {
                deviceData = cache.data.locks;
            } else
                deviceData = [];

            // Sort the devices alphabetically
            var devicesIDsSorted = deviceData.sort(function(a, b) {
                return a.nukiId > b.nukiId;
            });

            // Set the bridge automatically to the first one
            settings.device = devicesIDsSorted[0];

            // Save the settings
            saveSettings(action, inContext, settings);
        }

        // If a callback function was given
        if (inCallback !== undefined) {
            // Execute the callback function
            inCallback();
        }
    }
}