// src/components/Security/MockSecurityAlerts.jsx
import React, { useState, useEffect } from 'react';

const MockSecurityAlerts = ({ logData = [] }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // สร้างการแจ้งเตือนจากข้อมูล logData
  const generateAlerts = () => {
    if (!logData || logData.length === 0) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // กรองข้อมูลใน 1 ชั่วโมงที่ผ่านมา (จำลอง - ใช้ข้อมูลล่าสุด 50 รายการ)
    const recentLogs = logData.slice(-50);

    const generatedAlerts = [];

    // สร้างการแจ้งเตือนจากข้อมูลที่ถูกปฏิเสธ
    recentLogs.forEach(log => {
      if (log.allow === false || log.allow === 0 || log.reason) {
        generatedAlerts.push({
          alertType: 'ACCESS_DENIED',
          severity: 'medium',
          cardName: log.cardName || 'ไม่ระบุ',
          location: log.location || 'ไม่ระบุ',
          accessTime: log.dateTime || log.accessTime || new Date().toISOString(),
          reason: log.reason || 'การเข้าถึงถูกปฏิเสธ',
          userType: log.userType || log.department || 'ไม่ระบุ'
        });
      }
    });

    // สร้างการแจ้งเตือนสำหรับการเข้าถึงนอกเวลา
    recentLogs.forEach(log => {
      const logTime = new Date(log.dateTime || log.accessTime);
      const hour = logTime.getHours();
      
      if (hour < 6 || hour > 22) {
        generatedAlerts.push({
          alertType: 'UNUSUAL_TIME',
          severity: hour < 4 || hour > 23 ? 'high' : 'medium',
          cardName: log.cardName || 'ไม่ระบุ',
          location: log.location || 'ไม่ระบุ',
          accessTime: log.dateTime || log.accessTime || new Date().toISOString(),
          reason: `การเข้าถึงนอกเวลาปกติ (${hour}:00)`,
          userType: log.userType || 'ไม่ระบุ'
        });
      }
    });

    // หาการพยายามเข้าหลายครั้ง (กลุ่มตาม cardName)
    const attemptGroups = {};
    recentLogs.forEach(log => {
      const key = log.cardName || log.cardNumber || 'Unknown';
      if (!attemptGroups[key]) {
        attemptGroups[key] = [];
      }
      attemptGroups[key].push(log);
    });

    Object.entries(attemptGroups).forEach(([cardName, attempts]) => {
      const failedAttempts = attempts.filter(log => log.allow === false || log.allow === 0);
      
      if (failedAttempts.length >= 2) {
        generatedAlerts.push({
          alertType: 'MULTIPLE_ATTEMPTS',
          severity: failedAttempts.length >= 3 ? 'high' : 'medium',
          cardName: cardName,
          location: failedAttempts[0]?.location || 'ไม่ระบุ',
          accessTime: failedAttempts[failedAttempts.length - 1]?.dateTime || new Date().toISOString(),
          reason: `พยายามเข้าถึงล้มเหลว ${failedAttempts.length} ครั้ง`,
          userType: failedAttempts[0]?.userType || 'ไม่ระบุ'
        });
      }
    });

    // เรียงตามเวลาล่าสุด
    generatedAlerts.sort((a, b) => new Date(b.accessTime) - new Date(a.accessTime));
    
    setAlerts(generatedAlerts.slice(0, 20)); // แสดงแค่ 20 รายการล่าสุด
    setLoading(false);
  };

  useEffect(() => {
    generateAlerts();
  }, [logData]);

  // Alert severity styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Alert type icons
  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'ACCESS_DENIED':
        return '🚫';
      case 'UNUSUAL_TIME':
        return '🕐';
      case 'MULTIPLE_ATTEMPTS':
        return '🔄';
      case 'TAILGATING':
        return '🚪';
      default:
        return '⚠️';
    }
  };

  // Alert type names
  const getAlertTypeName = (alertType) => {
    switch (alertType) {
      case 'ACCESS_DENIED':
        return 'การเข้าถึงถูกปฏิเสธ';
      case 'UNUSUAL_TIME':
        return 'เข้าถึงนอกเวลา';
      case 'MULTIPLE_ATTEMPTS':
        return 'พยายามหลายครั้ง';
      case 'TAILGATING':
        return 'สงสัยการเข้าตาม';
      default:
        return 'การแจ้งเตือน';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">🚨</span>
            <h3 className="text-lg font-semibold text-gray-900">
              การแจ้งเตือนจากข้อมูลจริง
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            วิเคราะห์จากข้อมูล {logData.length} รายการ
          </div>
        </div>
      </div>

      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">✅</span>
            <p className="text-gray-500">ไม่มีการแจ้งเตือนจากข้อมูลปัจจุบัน</p>
            <p className="text-sm text-gray-400 mt-1">ระบบทำงานปกติ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityStyle(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <span className="text-lg mr-3 mt-1">
                      {getAlertIcon(alert.alertType)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {getAlertTypeName(alert.alertType)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity === 'high' ? 'เร่งด่วน' :
                           alert.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>ผู้ใช้:</strong> {alert.cardName || 'ไม่ระบุ'}
                        </p>
                        <p>
                          <strong>สถานที่:</strong> {alert.location}
                        </p>
                        {alert.reason && (
                          <p>
                            <strong>เหตุผล:</strong> {alert.reason}
                          </p>
                        )}
                        <p>
                          <strong>ประเภทผู้ใช้:</strong> {alert.userType || 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500 ml-4">
                    <div>
                      {new Date(alert.accessTime).toLocaleTimeString('th-TH')}
                    </div>
                    <div>
                      {new Date(alert.accessTime).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {alerts.length > 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  แสดง 10 จาก {alerts.length} การแจ้งเตือน
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            📊 การแจ้งเตือนจากข้อมูล: {alerts.length} รายการ
          </div>
          <div>
            🔄 อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockSecurityAlerts;