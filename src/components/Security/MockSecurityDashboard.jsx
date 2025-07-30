// src/components/Security/MockSecurityDashboard.jsx
import React, { useState, useEffect } from 'react';

const MockSecurityDashboard = ({ logData = [], stats = {} }) => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // วิเคราะห์ข้อมูลและสร้าง anomalies จาก logData
  const analyzeLogData = () => {
    if (!logData || logData.length === 0) {
      setAnomalies({
        summary: {
          totalAnomalies: 0,
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0
        },
        categories: {},
        analysisTime: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // วิเคราะห์ข้อมูลที่ผิดปกติ
    const deniedAccess = logData.filter(log => 
      log.allow === false || 
      log.allow === 0 || 
      log.reason
    );

    const multipleFailedAttempts = [];
    const unusualTimeAccess = [];
    const suspiciousCardUsage = [];
    const frequencyAnomalies = [];

    // หาการพยายามเข้าหลายครั้งที่ล้มเหลว
    const userAttempts = {};
    deniedAccess.forEach(log => {
      const key = `${log.cardName || log.cardNumber || 'Unknown'}_${log.location || 'Unknown'}`;
      if (!userAttempts[key]) {
        userAttempts[key] = [];
      }
      userAttempts[key].push(log);
    });

    Object.entries(userAttempts).forEach(([key, attempts]) => {
      if (attempts.length >= 3) {
        const [cardName, location] = key.split('_');
        multipleFailedAttempts.push({
          cardName,
          location,
          description: `ผู้ใช้ ${cardName} พยายามเข้าถึง ${location} ล้มเหลว ${attempts.length} ครั้ง`,
          failedAttempts: attempts.length,
          accessTime: attempts[attempts.length - 1].dateTime || attempts[attempts.length - 1].timestamp,
          riskLevel: attempts.length >= 5 ? 'high' : attempts.length >= 3 ? 'medium' : 'low'
        });
      }
    });

    // หาการเข้าถึงนอกเวลา (ก่อน 6:00 หรือหลัง 22:00)
    logData.forEach(log => {
      const timeStr = log.dateTime || log.accessTime || log.timestamp;
      if (timeStr) {
        const time = new Date(timeStr);
        const hour = time.getHours();
        if (hour < 6 || hour > 22) {
          unusualTimeAccess.push({
            cardName: log.cardName || log.cardNumber || 'ไม่ระบุ',
            location: log.location || 'ไม่ระบุ',
            description: `การเข้าถึงนอกเวลาปกติ เวลา ${time.toLocaleTimeString('th-TH')}`,
            accessTime: timeStr,
            riskLevel: hour < 4 || hour > 23 ? 'high' : 'medium'
          });
        }
      }
    });

    // หาการใช้การ์ดที่น่าสงสัย (เข้าหลายสถานที่ในเวลาใกล้เคียง)
    const cardMovements = {};
    logData.forEach(log => {
      const cardName = log.cardName || log.cardNumber;
      if (cardName && (log.allow === true || log.allow === 1)) {
        if (!cardMovements[cardName]) {
          cardMovements[cardName] = [];
        }
        cardMovements[cardName].push({
          location: log.location,
          time: new Date(log.dateTime || log.accessTime || log.timestamp),
          raw: log
        });
      }
    });

    Object.entries(cardMovements).forEach(([cardName, movements]) => {
      movements.sort((a, b) => a.time - b.time);
      for (let i = 1; i < movements.length; i++) {
        const timeDiff = (movements[i].time - movements[i-1].time) / (1000 * 60); // นาที
        const locationDiff = movements[i].location !== movements[i-1].location;
        
        if (locationDiff && timeDiff < 5 && timeDiff > 0) { // เข้าคนละสถานที่ในเวลาไม่ถึง 5 นาที
          suspiciousCardUsage.push({
            cardName,
            location: `${movements[i-1].location} → ${movements[i].location}`,
            description: `การเข้าถึงสถานที่ต่างกันในเวลา ${Math.round(timeDiff)} นาที`,
            accessTime: movements[i].raw.dateTime || movements[i].raw.accessTime || movements[i].raw.timestamp,
            timeSpanMinutes: timeDiff,
            riskLevel: timeDiff < 2 ? 'high' : 'medium'
          });
        }
      }
    });

    // หาความถี่การเข้าถึงที่ผิดปกติ
    const userFrequency = {};
    logData.forEach(log => {
      const cardName = log.cardName || log.cardNumber;
      if (cardName) {
        userFrequency[cardName] = (userFrequency[cardName] || 0) + 1;
      }
    });

    const avgFrequency = Object.values(userFrequency).reduce((a, b) => a + b, 0) / Object.keys(userFrequency).length;
    Object.entries(userFrequency).forEach(([cardName, frequency]) => {
      if (frequency > avgFrequency * 3) { // มากกว่าค่าเฉลี่ย 3 เท่า
        frequencyAnomalies.push({
          cardName,
          description: `ความถี่การเข้าถึงสูงผิดปกติ ${frequency} ครั้ง (เฉลี่ย ${Math.round(avgFrequency)} ครั้ง)`,
          accessTime: new Date().toISOString(),
          frequency,
          average: Math.round(avgFrequency),
          riskLevel: frequency > avgFrequency * 5 ? 'high' : 'medium'
        });
      }
    });

    // รวมผลการวิเคราะห์
    const categories = {
      multipleFailedAttempts: {
        type: 'multipleFailedAttempts',
        title: 'การพยายามเข้าหลายครั้งที่ล้มเหลว',
        description: 'ตรวจพบการพยายามเข้าถึงที่ล้มเหลวติดต่อกันหลายครั้ง',
        data: multipleFailedAttempts
      },
      unusualTimeAccess: {
        type: 'unusualTimeAccess',
        title: 'การเข้าถึงนอกเวลาปกติ',
        description: 'การเข้าถึงในช่วงเวลาที่ไม่ปกติ (ก่อน 6:00 หรือหลัง 22:00)',
        data: unusualTimeAccess
      },
      suspiciousCardUsage: {
        type: 'suspiciousCardUsage',
        title: 'การใช้การ์ดที่น่าสงสัย',
        description: 'การเข้าถึงหลายสถานที่ในช่วงเวลาสั้น',
        data: suspiciousCardUsage
      },
      frequencyAnomalies: {
        type: 'frequencyAnomalies',
        title: 'ความถี่การเข้าถึงผิดปกติ',
        description: 'การเข้าถึงที่มีความถี่สูงผิดปกติ',
        data: frequencyAnomalies
      }
    };

    const allAnomalies = [
      ...multipleFailedAttempts,
      ...unusualTimeAccess,
      ...suspiciousCardUsage,
      ...frequencyAnomalies
    ];

    const summary = {
      totalAnomalies: allAnomalies.length,
      highRisk: allAnomalies.filter(a => a.riskLevel === 'high').length,
      mediumRisk: allAnomalies.filter(a => a.riskLevel === 'medium').length,
      lowRisk: allAnomalies.filter(a => a.riskLevel === 'low').length
    };

    setAnomalies({
      summary,
      categories,
      analysisTime: new Date().toISOString()
    });

    setLoading(false);
  };

  useEffect(() => {
    analyzeLogData();
  }, [logData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // จำลองการโหลด
    analyzeLogData();
    setRefreshing(false);
  };

  const getRiskStyle = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '🟡';
      default:
        return '📊';
    }
  };

  const getCategoryIcon = (type) => {
    const icons = {
      multipleFailedAttempts: '🚫',
      unusualTimeAccess: '🕐',
      suspiciousCardUsage: '💳',
      frequencyAnomalies: '📊'
    };
    return icons[type] || '🔍';
  };

  const getFilteredAnomalies = () => {
    if (!anomalies || selectedCategory === 'all') {
      return anomalies ? Object.values(anomalies.categories) : [];
    }
    
    return anomalies.categories[selectedCategory] ? [anomalies.categories[selectedCategory]] : [];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-gray-600">กำลังวิเคราะห์ความผิดปกติ...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredAnomalies = getFilteredAnomalies();

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🚨 การวิเคราะห์ความผิดปกติ
          </h1>
          <p className="text-gray-600 mt-1">
            ตรวจจับและวิเคราะห์พฤติกรรมการเข้า-ออกที่ผิดปกติ
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                วิเคราะห์ใหม่
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {anomalies && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงสูง</p>
                <p className="text-2xl font-bold text-red-600">{anomalies.summary.highRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงปานกลาง</p>
                <p className="text-2xl font-bold text-yellow-600">{anomalies.summary.mediumRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🟡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงต่ำ</p>
                <p className="text-2xl font-bold text-green-600">{anomalies.summary.lowRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">รวมทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-600">{anomalies.summary.totalAnomalies}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3">หมวดหมู่ความผิดปกติ</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 ทั้งหมด
          </button>
          
          {anomalies && Object.entries(anomalies.categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                selectedCategory === key 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getCategoryIcon(key)}</span>
              {category.title}
              <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${
                selectedCategory === key ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {category.data.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Details */}
      <div className="space-y-6">
        {filteredAnomalies.map((category) => (
          <div key={category.type} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(category.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">
                    {category.data.length}
                  </span>
                  <p className="text-xs text-gray-500">รายการ</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {category.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">✅</span>
                  <p>ไม่พบความผิดปกติในหมวดหมู่นี้</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {category.data.slice(0, 10).map((item, index) => (
                    <div 
                      key={index}
                      className={`py-4 px-4 ${getRiskStyle(item.riskLevel)} border-transparent border rounded-lg mb-2`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getRiskIcon(item.riskLevel)}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskStyle(item.riskLevel)}`}>
                              {item.riskLevel === 'high' ? 'เสี่ยงสูง' :
                               item.riskLevel === 'medium' ? 'เสี่ยงปานกลาง' : 'เสี่ยงต่ำ'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-900 font-medium mb-1">
                            {item.description}
                          </p>
                          
                          <div className="text-xs text-gray-700 space-y-1 mt-2">
                            {item.cardName && (
                              <p><strong>👤 ผู้ใช้:</strong> {item.cardName}</p>
                            )}
                            {item.location && (
                              <p><strong>📍 สถานที่:</strong> {item.location}</p>
                            )}
                            {item.accessTime && (
                              <p><strong>⏰ เวลา:</strong> {new Date(item.accessTime).toLocaleString('th-TH')}</p>
                            )}
                            {item.failedAttempts && (
                              <p><strong>❌ ครั้งที่ล้มเหลว:</strong> {item.failedAttempts}</p>
                            )}
                            {item.timeSpanMinutes && (
                              <p><strong>⏱️ ช่วงเวลา:</strong> {Math.round(item.timeSpanMinutes)} นาที</p>
                            )}
                            {item.frequency && (
                              <p><strong>📊 ความถี่:</strong> {item.frequency} ครั้ง (เฉลี่ย {item.average} ครั้ง)</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right flex-shrink-0">
                          {item.accessTime && (
                            <p className="text-xs text-gray-500">
                              {new Date(item.accessTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {category.data.length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        แสดง 10 จาก {category.data.length} รายการ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Info */}
      {anomalies && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p>📊 วิเคราะห์เสร็จเมื่อ: {new Date(anomalies.analysisTime).toLocaleString('th-TH')}</p>
              <p>🗂️ ข้อมูลที่วิเคราะห์: {logData.length} รายการ</p>
            </div>
            <div>
              <p>🔄 การวิเคราะห์จากข้อมูลจริง</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockSecurityDashboard;