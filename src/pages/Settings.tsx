import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Switch } from 'components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Settings as SettingsIcon, AlertTriangle, Bell } from 'lucide-react';
import { getSettings, updateStockThresholds, updateSystemSettings, updateNotificationPreferences } from '../lib/api';

export default function Settings() {
  const [stockThresholds, setStockThresholds] = useState({
    lowStock: "20",
    criticalStock: "5",
  });

  const [notifications, setNotifications] = useState({
    stockAlerts: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    storeName: "Auto Parts Store",
    taxRate: "8",
    currency: "USD",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setStockThresholds({
        lowStock: String(data.lowStockThreshold || 20),
        criticalStock: String(data.criticalStockThreshold || 5),
      });
      setSystemSettings({
        storeName: data.storeName || "Auto Parts Store",
        taxRate: String(data.taxRate || 8),
        currency: data.currency || "USD",
      });
      setNotifications({
        stockAlerts: data.stockAlerts !== false,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveThresholds = async () => {
    setLoading(true);
    try {
      console.log('Saving thresholds:', stockThresholds);
      await updateStockThresholds(Number(stockThresholds.lowStock), Number(stockThresholds.criticalStock));
      alert("Stock thresholds updated successfully");
    } catch (error: any) {
      console.error('Error saving thresholds:', error);
      alert(`Failed to update stock thresholds: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      console.log('Saving notifications:', notifications);
      await updateNotificationPreferences(notifications.stockAlerts, false);
      alert("Notification preferences updated successfully");
    } catch (error: any) {
      console.error('Error saving notifications:', error);
      alert(`Failed to update notification preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    setLoading(true);
    try {
      console.log('Saving system settings:', systemSettings);
      await updateSystemSettings(systemSettings.storeName, Number(systemSettings.taxRate), systemSettings.currency);
      alert("System settings updated successfully");
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      alert(`Failed to update system settings: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  return (


    <>
<main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1A202C' }}>Settings</h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#4A5568' }}>Manage your system preferences</p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="stock" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-3 mb-6" 
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: '#E2E8F0', 
                padding: '4px',
                borderRadius: '8px'
              }}
            >
              <TabsTrigger 
                value="stock"
                style={{ borderRadius: '6px' }}
              >
                Stock Alerts
              </TabsTrigger>
              <TabsTrigger 
                value="system"
                style={{ borderRadius: '6px' }}
              >
                System
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                style={{ borderRadius: '6px' }}
              >
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Stock Alerts Tab */}
            <TabsContent value="stock" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" style={{ color: '#F59E0B' }} />
                    <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>
                      Stock Level Thresholds
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Set the threshold values for low stock and critical stock alerts
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="lowStock" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Low Stock Threshold (units) <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="lowStock"
                        type="number"
                        value={stockThresholds.lowStock}
                        onChange={(e) => setStockThresholds({ ...stockThresholds, lowStock: e.target.value })}
                        placeholder="20"
                        min="1"
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                      <p className="text-xs" style={{ color: '#718096' }}>
                        Products with stock below this level will be marked as "Low Stock"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="criticalStock" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Critical Stock Threshold (units) <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="criticalStock"
                        type="number"
                        value={stockThresholds.criticalStock}
                        onChange={(e) => setStockThresholds({ ...stockThresholds, criticalStock: e.target.value })}
                        placeholder="5"
                        min="1"
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                      <p className="text-xs" style={{ color: '#718096' }}>
                        Products with stock below this level will be marked as "Critical" and require immediate attention
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveThresholds}
                        disabled={loading}
                        className="h-12 font-bold"
                        style={{ backgroundColor: '#0883A4', color: '#FFFFFF', borderRadius: '8px' }}
                      >
                        {loading ? 'Saving...' : 'Save Thresholds'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="system" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SettingsIcon className="h-5 w-5" style={{ color: '#0883A4' }} />
                    <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>
                      System Settings
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Configure your store's basic information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Store Name <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="storeName"
                        value={systemSettings.storeName}
                        onChange={(e) => setSystemSettings({ ...systemSettings, storeName: e.target.value })}
                        placeholder="My Store"
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Default Tax Rate (%) <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        value={systemSettings.taxRate}
                        onChange={(e) => setSystemSettings({ ...systemSettings, taxRate: e.target.value })}
                        placeholder="8"
                        min="0"
                        max="100"
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Currency <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="currency"
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                        placeholder="USD"
                        maxLength={3}
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveSystem}
                        disabled={loading}
                        className="h-12 font-bold"
                        style={{ backgroundColor: '#0883A4', color: '#FFFFFF', borderRadius: '8px' }}
                      >
                        {loading ? 'Saving...' : 'Save System Settings'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-5 w-5" style={{ color: '#38A169' }} />
                    <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>
                      Notification Preferences
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm" style={{ color: '#718096' }}>
                    Choose how and when you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: '#E2E8F0' }}>
                      <div className="space-y-0.5">
                        <Label htmlFor="stockAlerts" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                          Stock Alerts
                        </Label>
                        <p className="text-xs" style={{ color: '#718096' }}>
                          Get notified when stock levels are low or critical
                        </p>
                      </div>
                      <Switch
                        id="stockAlerts"
                        checked={notifications.stockAlerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, stockAlerts: checked })}
                      />
                    </div>


                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveNotifications}
                        disabled={loading}
                        className="h-12 font-bold"
                        style={{ backgroundColor: '#0883A4', color: '#FFFFFF', borderRadius: '8px' }}
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
