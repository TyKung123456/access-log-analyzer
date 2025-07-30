// src/components/Security/SecurityAlerts.jsx - Real Data Analysis
import React, { useState, useEffect } from 'react';

const SecurityAlerts = ({ logData = [] }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // สร้างการแจ้งเตือนจากข้อมูลจริง
  const generateRealAlerts = () => {
    console.log('🚨 Generating real alerts from data...', { logDataCount: logData.length });
    
    if (!logData || logData.length === 0) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const recentAlerts = [];

    // ใช้ข้อมูลล่าสุด 100 รายการเพื่อจำลองการแจ้งเตือนเรียลไทม์
    const recentLogs = logData.slice(-100);

    // 1. การแจ้งเตือนการเข้าถึงที่ถูกปฏิเสธ
    recentLogs.forEach(log => {
      const isDenied = log.allow === false || log.allow === 0 || log.reason;
      
      if (isDenied) {
        recentAlerts.push({
          alertType: 'ACCESS_DENIED',
          severity: determineAccessDeniedSeverity(log),
          cardName: log.cardName || 'ไม่ระบุ',
          location: log.location || log.door || 'ไม่ระบุ',
          accessTime: log.dateTime,
          reason: log.reason || 'การเข้าถึงถูกปฏิเสธ',
          userType: log.userType || 'ไม่ระบุ',
          device: log.device,
          direction: log.direction
        });
      }
    });

    // 2. การแจ้งเตือนการเข้าถึงนอกเวลา
    recentLogs.forEach(log => {
      if (log.dateTime) {
        const accessTime = new Date(log.dateTime);
        const hour = accessTime.getHours();
        
        if (hour < 6 || hour > 22) {
          recentAlerts.push({
            alertType: 'UNUSUAL_TIME',
            severity: hour < 4 || hour > 23 ? 'high' : 'medium',
            cardName: log.cardName || 'ไม่ระบุ',
            location: log.location || log.door || 'ไม่ระบุ',
            accessTime: log.dateTime,
            reason: `การเข้าถึงนอกเวลาปกติ (${hour}:00)`,
            userType: log.userType || 'ไม่ระบุ',
            hour: hour
          });
        }
      }
    });

    // 3. การแจ้งเตือนการพยายามหลายครั้ง
    const attemptGroups = {};
    recentLogs.forEach(log => {
      if (log.allow === false || log.allow === 0) {
        const key = `${log.cardName || log.cardNumber || 'Unknown'}_${log.location || log.door || 'Unknown'}`;
        if (!attemptGroups[key]) {
          attemptGroups[key] = [];
        }
        attemptGroups[key].push(log);
      }
    });

    Object.entries(attemptGroups).forEach(([key, attempts]) => {
      if (attempts.length >= 2) {
        const [cardName, location] = key.split('_');
        const latestAttempt = attempts[attempts.length - 1];
        
        recentAlerts.push({
          alertType: 'MULTIPLE_ATTEMPTS',
          severity: attempts.length >= 3 ? 'high' : 'medium',
          cardName: cardName,
          location: location,
          accessTime: latestAttempt.dateTime,
          reason: `พบการพยายามเข้าถึงล้มเหลว ${attempts.length} ครั้งซ้อน`,
          userType: latestAttempt.userType || 'ไม่ระบุ',
          attemptCount: attempts.length
        });
      }
    });

    // 4. การแจ้งเตือนการเข้าถึงที่ผิดปกติ (เช่น เข้าทิศทางไม่ถูกต้อง)
    recentLogs.forEach(log => {
      // ตรวจสอบทิศทางที่ผิดปกติ หรือ permission ที่ไม่ตรงกัน
      if (log.direction && log.permission && log.allow === true) {
        // สมมติว่า OUT ต้องมี permission ที่อนุญาต
        if (log.direction === 'OUT' && !log.permission) {
          recentAlerts.push({
            alertType: 'PERMISSION_MISMATCH',
            severity: 'medium',
            cardName: log.cardName || 'ไม่ระบุ',
            location: log.location || log.door || 'ไม่ระบุ',
            accessTime: log.dateTime,
            reason: `การเข้าถึงทิศทาง ${log.direction} โดยไม่มีสิทธิ์ที่เหมาะสม`,
            userType: log.userType || 'ไม่ระบุ',
            direction: log.direction,
            permission: log.permission
          });
        }
      }
    });

    // เรียงตามเวลาล่าสุด
    recentAlerts.sort((a, b) => new Date(b.accessTime) - new Date(a.accessTime));
    
    setAlerts(recentAlerts.slice(0, 50)); // แสดงแค่ 50 รายการล่าสุด
    console.log('✅ Generated real alerts:', recentAlerts.length);
    setLoading(false);
  };

  // ฟังก์ชันกำหนดระดับความร้าย/แรงของการปฏิเสธ
  const determineAccessDeniedSeverity = (log) => {
    // ถ้ามี reason ที่เฉพาะเจาะจง แสดงว่าร้ายแรงกว่า
    if (log.reason) {
      if (log.reason.includes('INVALID') || log.reason.includes('EXPIRED')) {
        return 'high';
      }
      return 'medium';
    }
    return 'low';
  };

  useEffect(() => {
    generateRealAlerts();
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
      case 'PERMISSION_MISMATCH':
        return '⚠️';
      default:
        return '🚨';
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
      case 'PERMISSION_MISMATCH':
        return 'สิทธิ์ไม่ตรงกัน';
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
            วิเคราะห์จาก {logData.length} รายการ
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
          <>
            {/* Alert Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'high').length}
                </div>
                <div className="text-xs text-red-600">เร่งด่วน</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.severity === 'medium').length}
                </div>
                <div className="text-xs text-yellow-600">ปานกลาง</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.severity === 'low').length}
                </div>
                <div className="text-xs text-blue-600">ต่ำ</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {alerts.length}
                </div>
                <div className="text-xs text-gray-600">รวมทั้งหมด</div>
              </div>
            </div>

            {/* Alert List */}
            <div className="space-y-3">
              {alerts.slice(0, 15).map((alert, index) => (
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
                            <strong>ผู้ใช้:</strong> {alert.cardName}
                          </p>
                          <p>
                            <strong>สถานที่:</strong> {alert.location}
                          </p>
                          <p>
                            <strong>เหตุผล:</strong> {alert.reason}
                          </p>
                          {alert.userType && alert.userType !== 'ไม่ระบุ' && (
                            <p>
                              <strong>ประเภทผู้ใช้:</strong> {alert.userType}
                            </p>
                          )}
                          {alert.device && (
                            <p>
                              <strong>อุปกรณ์:</strong> {alert.device}
                            </p>
                          )}
                          {alert.direction && (
                            <p>
                              <strong>ทิศทาง:</strong> {alert.direction}
                            </p>
                          )}
                          {alert.attemptCount && (
                            <p>
                              <strong>จำนวนครั้ง:</strong> {alert.attemptCount}
                            </p>
                          )}
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
              
              {alerts.length > 15 && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    แสดง 15 จาก {alerts.length} การแจ้งเตือน
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            📊 การแจ้งเตือนจากข้อมูลจริง: {alerts.length} รายการ
          </div>
          <div>
            🔄 อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAlerts;