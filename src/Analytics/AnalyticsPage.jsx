// src/components/Analytics/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import SecurityDashboard from '../Security/SecurityDashboard';
import SecurityAlerts from '../Security/SecurityAlerts';
import { Shield, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const AnalyticsPage = ({ logData, stats }) => {
  const [activeView, setActiveView] = useState('overview');
  const [securityMetrics, setSecurityMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate security metrics from log data
  useEffect(() => {
    const calculateSecurityMetrics = () => {
      if (!logData || logData.length === 0) {
        setSecurityMetrics({
          totalEvents: 0,
          riskScore: 0,
          alertsToday: 0,
          securityTrend: 'stable'
        });
        setIsLoading(false);
        return;
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate basic metrics
      const todayEvents = logData.filter(log => 
        log.accessTime && log.accessTime.startsWith(todayStr)
      );
      
      const deniedEvents = logData.filter(log => 
        log.status === 'denied' || log.accessResult === 'DENIED'
      );
      
      const alertsToday = todayEvents.filter(log => 
        log.status === 'denied' || log.accessResult === 'DENIED'
      ).length;

      // Calculate risk score (0-100)
      const deniedRate = logData.length > 0 ? (deniedEvents.length / logData.length) * 100 : 0;
      const riskScore = Math.min(100, Math.max(0, deniedRate * 2)); // Scale denied rate

      // Determine security trend
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayAlerts = logData.filter(log => 
        log.accessTime && log.accessTime.startsWith(yesterdayStr) &&
        (log.status === 'denied' || log.accessResult === 'DENIED')
      ).length;

      let securityTrend = 'stable';
      if (alertsToday > yesterdayAlerts * 1.2) {
        securityTrend = 'increasing';
      } else if (alertsToday < yesterdayAlerts * 0.8) {
        securityTrend = 'decreasing';
      }

      setSecurityMetrics({
        totalEvents: logData.length,
        riskScore: Math.round(riskScore),
        alertsToday,
        securityTrend,
        deniedRate: Math.round(deniedRate * 10) / 10
      });
      
      setIsLoading(false);
    };

    calculateSecurityMetrics();
  }, [logData]);

  const views = [
    {
      id: 'overview',
      label: 'ภาพรวม',
      icon: TrendingUp,
      description: 'สรุปสถานการณ์ความปลอดภัย'
    },
    {
      id: 'anomalies',
      label: 'ความผิดปกติ',
      icon: Shield,
      description: 'การวิเคราะห์ความผิดปกติเชิงลึก'
    },
    {
      id: 'alerts',
      label: 'การแจ้งเตือน',
      icon: AlertTriangle,
      description: 'การแจ้งเตือนแบบเรียลไทม์'
    },
    {
      id: 'monitoring',
      label: 'การติดตาม',
      icon: Activity,
      description: 'การติดตามแบบต่อเนื่อง'
    }
  ];

  const getRiskLevelColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">เหตุการณ์ทั้งหมด</p>
              <p className="text-2xl font-bold text-blue-600">
                {securityMetrics?.totalEvents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${
          securityMetrics?.riskScore >= 70 ? 'border-red-500' :
          securityMetrics?.riskScore >= 40 ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">คะแนนความเสี่ยง</p>
              <p className={`text-2xl font-bold ${
                securityMetrics?.riskScore >= 70 ? 'text-red-600' :
                securityMetrics?.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {securityMetrics?.riskScore || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">การแจ้งเตือนวันนี้</p>
              <p className="text-2xl font-bold text-orange-600">
                {securityMetrics?.alertsToday || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">{getTrendIcon(securityMetrics?.securityTrend)}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">แนวโน้มความปลอดภัย</p>
              <p className={`text-lg font-bold ${getTrendColor(securityMetrics?.securityTrend)}`}>
                {securityMetrics?.securityTrend === 'increasing' ? 'เพิ่มขึ้น' :
                 securityMetrics?.securityTrend === 'decreasing' ? 'ลดลง' : 'คงที่'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🛡️</span>
          สถานะความปลอดภัยด่วน
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${getRiskLevelColor(securityMetrics?.riskScore || 0)}`}>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {securityMetrics?.riskScore >= 70 ? '🚨' :
                 securityMetrics?.riskScore >= 40 ? '⚠️' : '✅'}
              </div>
              <div className="font-semibold">
                {securityMetrics?.riskScore >= 70 ? 'เสี่ยงสูง' :
                 securityMetrics?.riskScore >= 40 ? 'เสี่ยงปานกลาง' : 'ปลอดภัย'}
              </div>
              <div className="text-sm mt-1">
                คะแนนความเสี่ยง: {securityMetrics?.riskScore || 0}%
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">อัตราการปฏิเสธ</div>
              <div className="text-sm mt-1">
                {securityMetrics?.deniedRate || 0}% ของการเข้าถึงทั้งหมด
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-semibold">การอัปเดต</div>
              <div className="text-sm mt-1">
                อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Preview */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">🚨</span>
            การแจ้งเตือนล่าสุด
          </h3>
        </div>
        <div className="p-6">
          <SecurityAlerts />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return renderOverview();
      case 'anomalies':
        return <SecurityDashboard />;
      case 'alerts':
        return <SecurityAlerts />;
      case 'monitoring':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🚧</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ฟีเจอร์การติดตาม
              </h3>
              <p className="text-gray-600">
                ฟีเจอร์นี้อยู่ระหว่างการพัฒนา
              </p>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-blue-600" />
            การวิเคราะห์ความปลอดภัย
          </h1>
          <p className="text-gray-600 mt-1">
            วิเคราะห์และติดตามความผิดปกติในระบบการเข้า-ออก
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>อัปเดตแบบเรียลไทม์</span>
        </div>
      </div>

      {/* View Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <nav className="flex space-x-1" role="tablist">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-md font-medium text-sm
                  transition-all duration-200 ease-in-out flex-1
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                title={view.description}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div role="tabpanel" aria-labelledby={`tab-${activeView}`}>
        {renderContent()}
      </div>

      {/* Footer Info */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>📊 ข้อมูลทั้งหมด: {securityMetrics?.totalEvents || 0} รายการ</span>
            <span>🕐 อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              securityMetrics?.riskScore >= 70 ? 'bg-red-100 text-red-800' :
              securityMetrics?.riskScore >= 40 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {securityMetrics?.riskScore >= 70 ? '🚨 เสี่ยงสูง' :
               securityMetrics?.riskScore >= 40 ? '⚠️ เสี่ยงปานกลาง' : 
               '✅ ปลอดภัย'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;