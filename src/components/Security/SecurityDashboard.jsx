// src/components/Security/SecurityDashboard.jsx - Fixed with Export Button
import React, { useState, useEffect } from 'react';

const SecurityDashboard = ({ logData = [], stats = {} }) => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfAvailable, setPdfAvailable] = useState(false);

  // Check if jsPDF is available
  useEffect(() => {
    const checkPDFAvailability = async () => {
      try {
        await import('jspdf');
        await import('jspdf-autotable');
        setPdfAvailable(true);
        console.log('✅ jsPDF libraries are available');
      } catch (error) {
        setPdfAvailable(false);
        console.log('⚠️ jsPDF libraries not found');
      }
    };
    
    checkPDFAvailability();
  }, []);

  // Export security report as PDF - will be implemented after installing jsPDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      console.log('📄 Starting PDF export...');
      
      if (!anomalies) {
        throw new Error('ไม่มีข้อมูลการวิเคราะห์สำหรับการส่งออก');
      }

      // Dynamic import to avoid build errors when jsPDF is not installed
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Simple PDF generation - you can enhance this later
      doc.setFontSize(20);
      doc.text('Security Analysis Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
      doc.text(`Total Anomalies: ${anomalies.summary.totalAnomalies}`, 20, 50);
      doc.text(`High Risk: ${anomalies.summary.highRisk}`, 20, 60);
      doc.text(`Medium Risk: ${anomalies.summary.mediumRisk}`, 20, 70);
      doc.text(`Low Risk: ${anomalies.summary.lowRisk}`, 20, 80);
      
      // Add summary table
      const tableData = Object.entries(anomalies.categories).map(([key, category]) => [
        category.title,
        category.data.length.toString(),
        category.data.filter(item => item.riskLevel === 'high').length.toString()
      ]);
      
      doc.autoTable({
        startY: 100,
        head: [['Category', 'Total Count', 'High Risk Count']],
        body: tableData,
        theme: 'striped'
      });
      
      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`security-analysis-report-${timestamp}.pdf`);
      
      console.log('✅ PDF exported successfully');
      
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      
      // Fallback to text export if PDF libraries are not available
      if (error.message.includes('jspdf') || error.message.includes('jsPDF')) {
        alert('PDF library ยังไม่ได้ติดตั้ง กรุณาติดตั้งก่อน: npm install jspdf jspdf-autotable');
        
        // Export as text file instead
        const textReport = generateTextReport(anomalies, stats, logData);
        downloadTextFile(textReport, `security-analysis-report-${new Date().toISOString().split('T')[0]}.txt`);
      } else {
        alert(`การส่งออกรายงาน PDF ล้มเหลว: ${error.message}`);
      }
    } finally {
      setExporting(false);
    }
  };

  // Fallback text report generator
  const generateTextReport = (anomalies, stats, logData) => {
    const lines = [];
    lines.push('SECURITY ANALYSIS REPORT');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Report ID: SEC-${Date.now().toString().slice(-8)}`);
    lines.push('');
    lines.push('EXECUTIVE SUMMARY');
    lines.push('-'.repeat(30));
    lines.push(`Total Records Analyzed: ${logData?.length || 0}`);
    lines.push(`Total Anomalies: ${anomalies?.summary?.totalAnomalies || 0}`);
    lines.push(`High Risk: ${anomalies?.summary?.highRisk || 0}`);
    lines.push(`Medium Risk: ${anomalies?.summary?.mediumRisk || 0}`);
    lines.push(`Low Risk: ${anomalies?.summary?.lowRisk || 0}`);
    lines.push('');
    
    if (anomalies?.categories) {
      lines.push('DETAILED ANALYSIS');
      lines.push('-'.repeat(30));
      
      Object.entries(anomalies.categories).forEach(([key, category]) => {
        lines.push('');
        lines.push(`${category.title.toUpperCase()}`);
        lines.push(`Description: ${category.description}`);
        lines.push(`Total Incidents: ${category.data.length}`);
        
        if (category.data.length > 0) {
          lines.push('Top Incidents:');
          category.data.slice(0, 5).forEach((item, index) => {
            lines.push(`  ${index + 1}. ${item.cardName || 'Unknown'} - ${item.location || 'Unknown'}`);
            lines.push(`     Time: ${item.accessTime ? new Date(item.accessTime).toLocaleString() : 'Unknown'}`);
            lines.push(`     Risk: ${item.riskLevel || 'Unknown'}`);
            lines.push(`     Description: ${item.description || 'No description'}`);
          });
        }
      });
    }
    
    lines.push('');
    lines.push('END OF REPORT');
    
    return lines.join('\n');
  };

  // Download text file
  const downloadTextFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // วิเคราะห์ข้อมูลจริงจาก PostgreSQL
  const analyzeRealData = () => {
    console.log('🔍 Starting real data analysis...', { logDataCount: logData.length });
    
    if (!logData || logData.length === 0) {
      setAnomalies({
        summary: { totalAnomalies: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 },
        categories: {},
        analysisTime: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    // สร้างการวิเคราะห์จากข้อมูลจริง
    const accessDenied = [];
    const unusualTimeAccess = [];
    const multipleFailures = [];
    const locationAnomalies = [];

    // 1. วิเคราะห์การเข้าถึงที่ถูกปฏิเสธ
    logData.forEach(log => {
      // ตรวจสอบ field ที่บ่งบอกถึงการปฏิเสธ
      const isDenied = log.allow === false || log.allow === 0 || log.reason;
      
      if (isDenied) {
        accessDenied.push({
          cardName: log.cardName || 'ไม่ระบุ',
          location: log.location || log.door || 'ไม่ระบุ',
          description: `การเข้าถึงถูกปฏิเสธ: ${log.reason || 'ไม่มีเหตุผล'}`,
          accessTime: log.dateTime,
          reason: log.reason || 'การเข้าถึงถูกปฏิเสธ',
          device: log.device,
          riskLevel: log.reason ? 'medium' : 'low'
        });
      }
    });

    // 2. วิเคราะห์การเข้าถึงนอกเวลา
    logData.forEach(log => {
      if (log.dateTime) {
        const accessTime = new Date(log.dateTime);
        const hour = accessTime.getHours();
        
        // ถือว่านอกเวลาหากเป็น ก่อน 6:00 หรือหลัง 22:00
        if (hour < 6 || hour > 22) {
          unusualTimeAccess.push({
            cardName: log.cardName || 'ไม่ระบุ',
            location: log.location || log.door || 'ไม่ระบุ',
            description: `เข้าถึงนอกเวลาปกติ เวลา ${accessTime.toLocaleTimeString('th-TH')}`,
            accessTime: log.dateTime,
            hour: hour,
            userType: log.userType,
            riskLevel: hour < 4 || hour > 23 ? 'high' : 'medium'
          });
        }
      }
    });

    // 3. วิเคราะห์การล้มเหลวหลายครั้ง (กลุ่มตาม cardName + location)
    const failureGroups = {};
    accessDenied.forEach(denial => {
      const key = `${denial.cardName}_${denial.location}`;
      if (!failureGroups[key]) {
        failureGroups[key] = [];
      }
      failureGroups[key].push(denial);
    });

    Object.entries(failureGroups).forEach(([key, failures]) => {
      if (failures.length >= 2) {
        const [cardName, location] = key.split('_');
        multipleFailures.push({
          cardName,
          location,
          description: `พบการล้มเหลวหลายครั้ง: ${failures.length} ครั้ง`,
          failedAttempts: failures.length,
          accessTime: failures[failures.length - 1].accessTime,
          reasons: [...new Set(failures.map(f => f.reason).filter(Boolean))],
          riskLevel: failures.length >= 5 ? 'high' : failures.length >= 3 ? 'medium' : 'low'
        });
      }
    });

    // 4. วิเคราะห์ความผิดปกติตามสถานที่
    const locationStats = {};
    logData.forEach(log => {
      const location = log.location || log.door || 'ไม่ระบุ';
      if (!locationStats[location]) {
        locationStats[location] = {
          total: 0,
          denied: 0,
          users: new Set()
        };
      }
      locationStats[location].total++;
      if (log.allow === false || log.allow === 0) {
        locationStats[location].denied++;
      }
      if (log.cardName) {
        locationStats[location].users.add(log.cardName);
      }
    });

    Object.entries(locationStats).forEach(([location, stats]) => {
      const denialRate = stats.total > 0 ? (stats.denied / stats.total) * 100 : 0;
      
      // ถือว่าผิดปกติหากอัตราการปฏิเสธ > 20%
      if (denialRate > 20 && stats.total >= 5) {
        locationAnomalies.push({
          location,
          description: `อัตราการปฏิเสธสูง ${denialRate.toFixed(1)}% (${stats.denied}/${stats.total})`,
          denialRate: denialRate.toFixed(1),
          totalAccess: stats.total,
          deniedAccess: stats.denied,
          uniqueUsers: stats.users.size,
          accessTime: new Date().toISOString(),
          riskLevel: denialRate > 50 ? 'high' : denialRate > 30 ? 'medium' : 'low'
        });
      }
    });

    // รวมผลการวิเคราะห์
    const categories = {
      accessDenied: {
        type: 'accessDenied',
        title: 'การเข้าถึงถูกปฏิเสธ',
        description: 'รายการการเข้าถึงที่ถูกปฏิเสธจากระบบ',
        data: accessDenied.slice(0, 50) // จำกัดจำนวนเพื่อประสิทธิภาพ
      },
      unusualTimeAccess: {
        type: 'unusualTimeAccess',
        title: 'การเข้าถึงนอกเวลา',
        description: 'การเข้าถึงในช่วงเวลาที่ไม่ปกติ (นอกเวลาทำการ)',
        data: unusualTimeAccess
      },
      multipleFailures: {
        type: 'multipleFailures',
        title: 'ความล้มเหลวหลายครั้ง',
        description: 'ผู้ใช้ที่มีการล้มเหลวในการเข้าถึงหลายครั้ง',
        data: multipleFailures
      },
      locationAnomalies: {
        type: 'locationAnomalies',
        title: 'ความผิดปกติตามสถานที่',
        description: 'สถานที่ที่มีอัตราการปฏิเสธสูงผิดปกติ',
        data: locationAnomalies
      }
    };

    const allAnomalies = [
      ...accessDenied,
      ...unusualTimeAccess,
      ...multipleFailures,
      ...locationAnomalies
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
      analysisTime: new Date().toISOString(),
      dataSource: 'PostgreSQL Database'
    });

    console.log('✅ Real data analysis completed:', summary);
    setLoading(false);
  };

  useEffect(() => {
    analyzeRealData();
  }, [logData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing security analysis...');
    await new Promise(resolve => setTimeout(resolve, 500));
    analyzeRealData();
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
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '🟡';
      default: return '📊';
    }
  };

  const getCategoryIcon = (type) => {
    const icons = {
      accessDenied: '🚫',
      unusualTimeAccess: '🕐',
      multipleFailures: '❌',
      locationAnomalies: '📍'
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-gray-600">กำลังวิเคราะห์ข้อมูลจริงจาก Database...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredAnomalies = getFilteredAnomalies();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              🛡️ การวิเคราะห์ความปลอดภัย
            </h1>
            <p className="text-gray-600 mt-1">
              วิเคราะห์จากข้อมูลจริง PostgreSQL Database
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting || !anomalies}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={pdfAvailable ? "ส่งออกรายงานเป็น PDF" : "ส่งออกรายงาน (จะเป็นไฟล์ข้อความ หากยังไม่ติดตั้ง jsPDF)"}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  กำลังสร้างรายงาน...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {pdfAvailable ? 'ส่งออก PDF' : 'ส่งออกรายงาน'}
                </>
              )}
            </button>
            
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

        {/* Data Source Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-sm text-blue-800">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              กำลังวิเคราะห์ข้อมูลจริง {logData.length} รายการ จาก PostgreSQL Database
            </span>
          </div>
        </div>

        {/* PDF Export Info - แสดงเฉพาะเมื่อยังไม่มี jsPDF */}
        {!pdfAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">การส่งออก PDF</div>
                <div>
                  สำหรับการส่งออกเป็น PDF กรุณาติดตั้ง dependencies ก่อน: 
                  <code className="bg-yellow-100 px-1 py-0.5 rounded ml-1">npm install jspdf jspdf-autotable</code>
                </div>
                <div className="mt-1">
                  หากยังไม่ติดตั้ง ระบบจะส่งออกเป็นไฟล์ข้อความแทน
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Available Success Message */}
        {pdfAvailable && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-sm text-green-800">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                ✅ PDF Export พร้อมใช้งาน - คุณสามารถส่งออกรายงานเป็น PDF ได้แล้ว
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {anomalies && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงสูง</p>
                <p className="text-2xl font-bold text-red-600">{anomalies.summary.highRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงปานกลาง</p>
                <p className="text-2xl font-bold text-yellow-600">{anomalies.summary.mediumRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🟡</span>
              <div>
                <p className="text-sm font-medium text-gray-600">ความเสี่ยงต่ำ</p>
                <p className="text-2xl font-bold text-green-600">{anomalies.summary.lowRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
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
                <div className="space-y-3">
                  {category.data.slice(0, 20).map((item, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${getRiskStyle(item.riskLevel)}`}
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
                          
                          <p className="text-sm text-gray-900 font-medium mb-2">
                            {item.description}
                          </p>
                          
                          <div className="text-xs text-gray-700 space-y-1">
                            {item.cardName && (
                              <p><strong>👤 ผู้ใช้:</strong> {item.cardName}</p>
                            )}
                            {item.location && (
                              <p><strong>📍 สถานที่:</strong> {item.location}</p>
                            )}
                            {item.device && (
                              <p><strong>🔧 อุปกรณ์:</strong> {item.device}</p>
                            )}
                            {item.accessTime && (
                              <p><strong>⏰ เวลา:</strong> {new Date(item.accessTime).toLocaleString('th-TH')}</p>
                            )}
                            {item.reason && (
                              <p><strong>📝 เหตุผล:</strong> {item.reason}</p>
                            )}
                            {item.failedAttempts && (
                              <p><strong>❌ ครั้งที่ล้มเหลว:</strong> {item.failedAttempts}</p>
                            )}
                            {item.denialRate && (
                              <p><strong>📊 อัตราปฏิเสธ:</strong> {item.denialRate}%</p>
                            )}
                            {item.hour !== undefined && (
                              <p><strong>🕐 ชั่วโมง:</strong> {item.hour}:00</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right text-xs text-gray-500">
                          {item.accessTime && (
                            <p>{new Date(item.accessTime).toLocaleDateString('th-TH')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {category.data.length > 20 && (
                    <div className="text-center pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        แสดง 20 จาก {category.data.length} รายการ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Summary */}
      {anomalies && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>📊 ข้อมูลที่วิเคราะห์:</strong> {logData.length} รายการ</p>
              <p><strong>🗄️ แหล่งข้อมูล:</strong> {anomalies.dataSource}</p>
            </div>
            <div>
              <p><strong>⏰ วิเคราะห์เมื่อ:</strong> {new Date(anomalies.analysisTime).toLocaleString('th-TH')}</p>
              <p><strong>🔄 สถานะ:</strong> <span className="text-green-600">ใช้ข้อมูลจริง</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;