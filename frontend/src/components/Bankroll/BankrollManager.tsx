'use client';

import { useState, useEffect, useRef } from 'react';

interface BankrollStatus {
  id: number;
  starting_balance: number;
  current_balance: number;
  currency: string;
  total_profit_loss: number;
  total_bets_placed: number;
  win_rate: number;
  roi_percentage: number;
  max_drawdown: number;
  risk_level: string;
  total_roi_percentage: number;
  net_profit_loss: number;
}

interface BankrollManagerProps {
  onBankrollUpdate?: (bankroll: BankrollStatus) => void;
}

export const BankrollManager = ({ onBankrollUpdate }: BankrollManagerProps) => {
  const [bankroll, setBankroll] = useState<BankrollStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    starting_balance: 1000,
    current_balance: 1000
  });
  const isInitialLoad = useRef(true);

  // Load bankroll status
  const loadBankroll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bankroll');
      
      if (!response.ok) {
        throw new Error(`Bankroll API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBankroll(data.bankroll);
        setEditValues({
          starting_balance: data.bankroll.starting_balance,
          current_balance: data.bankroll.current_balance
        });
        // Only call callback if it exists and won't cause infinite loop
        if (onBankrollUpdate && typeof onBankrollUpdate === 'function') {
          // Use setTimeout to break the render cycle
          setTimeout(() => onBankrollUpdate(data.bankroll), 0);
        }
      }
    } catch (error) {
      console.error('Error loading bankroll:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update bankroll settings
  const updateBankroll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bankroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBankroll(data.bankroll);
        setEditing(false);
        // Only call callback if it exists and won't cause infinite loop
        if (onBankrollUpdate && typeof onBankrollUpdate === 'function') {
          // Use setTimeout to break the render cycle
          setTimeout(() => onBankrollUpdate(data.bankroll), 0);
        }
      }
    } catch (error) {
      console.error('Error updating bankroll:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset bankroll
  const resetBankroll = async () => {
    if (!confirm('Are you sure you want to reset your bankroll? This will clear all betting history.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/bankroll?confirm=yes', {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload the bankroll after reset
        await loadBankroll();
        // Don't trigger callback on reset - it will cause loop
        alert(`Reset successful! Cleared ${data.deleted_count} bet records.`);
      } else {
        alert('Reset failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error resetting bankroll:', error);
      alert('Reset failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) {
      loadBankroll();
      isInitialLoad.current = false;
    }
  }, []);

  if (loading && !bankroll) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!bankroll) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Bankroll Management</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-white mb-2">Bankroll Not Found</h3>
          <p className="text-gray-300 mb-4">
            Your bankroll system needs to be initialized.
          </p>
          <button
            onClick={loadBankroll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Initialize Bankroll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Flat Staking Bankroll</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={resetBankroll}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Current Balance Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center p-4 bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            ${bankroll.current_balance.toFixed(2)}
          </div>
          <div className="text-sm text-gray-300">Current Balance</div>
        </div>
        
        <div className="text-center p-4 bg-gray-700 rounded-lg">
          <div className={`text-2xl font-bold ${bankroll.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {bankroll.total_profit_loss >= 0 ? '+' : ''}${bankroll.total_profit_loss.toFixed(2)}
          </div>
          <div className="text-sm text-gray-300">Total P&L</div>
        </div>

        <div className="text-center p-4 bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {bankroll.total_bets_placed}
          </div>
          <div className="text-sm text-gray-300">Bets Placed</div>
        </div>
      </div>

      {editing ? (
        /* Edit Mode */
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Bankroll</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Starting Balance</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={editValues.starting_balance}
                onChange={(e) => setEditValues({...editValues, starting_balance: parseFloat(e.target.value) || 1000})}
                className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Current Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editValues.current_balance}
                onChange={(e) => setEditValues({...editValues, current_balance: parseFloat(e.target.value) || 0})}
                className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Manually adjust your current balance</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={updateBankroll}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:bg-gray-600"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <h3 className="text-lg font-semibold text-white">Bankroll Details</h3>
            
            <div className="flex flex-wrap gap-6 text-base">
              <div>
                <span className="text-gray-300">Starting Balance:</span>
                <span className="text-white ml-2">${bankroll.starting_balance.toFixed(2)}</span>
              </div>
              
              <div>
                <span className="text-gray-300">Win Rate:</span>
                <span className="text-white ml-2">{(bankroll.win_rate || 0).toFixed(1)}%</span>
              </div>
              
              <div>
                <span className="text-gray-300">ROI:</span>
                <span className={`ml-2 ${(bankroll.roi_percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(bankroll.roi_percentage || 0) >= 0 ? '+' : ''}{(bankroll.roi_percentage || 0).toFixed(2)}%
                </span>
              </div>
              
              <div>
                <span className="text-gray-300">Max Drawdown:</span>
                <span className="text-red-400 ml-2">-${(bankroll.max_drawdown || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};