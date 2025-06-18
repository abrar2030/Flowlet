import React, { useState } from 'react';
import { Wifi, WifiOff, Sync, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline.js';

const OfflineIndicator = () => {
  const { 
    isOnline, 
    offlineActions, 
    storageStats, 
    syncOfflineActions,
    clearOfflineData 
  } = useOffline();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Don't show indicator when online and no pending actions
  if (isOnline && offlineActions.length === 0) {
    return null;
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineActions();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      await clearOfflineData();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="px-4 py-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Back Online' : 'You\'re Offline'}
            </span>
            {offlineActions.length > 0 && (
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                {offlineActions.length} pending
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isOnline && offlineActions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSync();
                }}
                disabled={isSyncing}
                className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
              >
                <Sync className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white border-opacity-20">
            <div className="space-y-2">
              {/* Connection Status */}
              <div className="flex items-center justify-between text-sm">
                <span>Connection Status:</span>
                <span className={`font-medium ${isOnline ? 'text-green-200' : 'text-red-200'}`}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Pending Actions */}
              {offlineActions.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Pending Actions:</span>
                    <span className="font-medium">{offlineActions.length}</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {offlineActions.slice(0, 5).map((action, index) => (
                      <div key={action.id} className="flex items-center space-x-2 text-xs bg-white bg-opacity-10 rounded px-2 py-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {action.type}: {action.data?.description || 'Pending sync'}
                        </span>
                      </div>
                    ))}
                    {offlineActions.length > 5 && (
                      <div className="text-xs text-center text-white text-opacity-70">
                        +{offlineActions.length - 5} more actions
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Storage Stats */}
              {storageStats && (
                <div className="flex items-center justify-between text-sm">
                  <span>Cached Items:</span>
                  <span className="font-medium">{storageStats.totalItems}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                {isOnline && offlineActions.length > 0 && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync All'}
                  </button>
                )}
                <button
                  onClick={handleClearData}
                  className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs transition-colors"
                >
                  Clear Cache
                </button>
              </div>

              {/* Offline Tips */}
              {!isOnline && (
                <div className="mt-2 p-2 bg-white bg-opacity-10 rounded text-xs">
                  <div className="font-medium mb-1">While offline, you can:</div>
                  <ul className="space-y-1 text-white text-opacity-80">
                    <li>• View cached transactions</li>
                    <li>• Access saved settings</li>
                    <li>• Queue actions for later sync</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;

