// Prototype which represents a brightness action
function LockAction(inContext, inSettings) {
    // Init BrightnessAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Set the default values
    setDefaults();

    // Public function called on key up event
    this.onKeyUp = function(inContext, inSettings, inCoordinates, inUserDesiredState, inState) {
        // If onKeyUp was triggered manually, load settings
        if (inSettings === undefined) {
            inSettings = instance.getSettings();
        }

        // Check if any bridge is configured
        if (!('device' in inSettings)) {
            log('No device configured');
            showAlert(inContext);
            return;
        }

        var deviceCache = cache.data && cache.data.locks.find(lock => lock.nukiId === inSettings.device);

        // Check if the configured bridge is in the cache
        if (!deviceCache) {
            log('Device ' + inSettings.device.name + ' not found in cache');
            showAlert(inContext);
            return;
        }
    };

    // Before overwriting parent method, save a copy of it
    var actionNewCacheAvailable = this.newCacheAvailable;

    // Public function called when new cache is available
    this.newCacheAvailable = function(inCallback) {
        // Call actions newCacheAvailable method
        actionNewCacheAvailable.call(instance, function() {
            // Set defaults
            setDefaults();

            // Call the callback function
            inCallback();
        });
    };

    // Private function to set the defaults
    function setDefaults() {
        // Get the settings and the context
        var settings = instance.getSettings();
        var context = instance.getContext();

        // If brightness is already set for this action
        if ('device' in settings) {
            return;
        }

        // Save the settings
        saveSettings('dev.juanmoi.nuki.lock', context, settings);
    }
}