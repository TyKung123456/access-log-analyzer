<<<<<<< HEAD
// components/Upload/UploadPage.jsx - Enhanced with Immediate Client-Side Validation
import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, BarChart3, Clock, XCircle } from 'lucide-react';

// A small reusable component for displaying statistics
const StatCard = ({ icon, label, value, color = 'green' }) => (
  <div className={`bg-white rounded-lg p-2 border border-${color}-200`}>
    <div className={`flex items-center gap-1 text-${color}-600`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    <p className={`text-${color}-800 font-semibold text-sm`}>{value}</p>
  </div>
);

const UploadPage = ({ isUploading, uploadProgress, onFileUpload, logDataCount, uploadError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(''); // State for immediate file validation errors
  const [uploadStats, setUploadStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Effect to get last upload stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('lastUploadStats');
      if (savedStats) {
        setUploadStats(JSON.parse(savedStats));
      }
    } catch (e) {
      console.warn('Failed to parse upload stats from localStorage:', e);
    }
  }, []);

  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    
    // Reset states
    setSelectedFile(null);
    setFileError('');

    if (!file) {
      return;
    }

    // --- Immediate Client-Side Validation ---
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (file.size > maxSize) {
      setFileError(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${formatFileSize(maxSize)}). ขนาดไฟล์ของคุณ: ${formatFileSize(file.size)}`);
      return;
    }

    if (!allowedTypes.includes(fileExtension)) {
      setFileError(`ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ .csv, .xlsx, .xls). ไฟล์ของคุณเป็นชนิด: .${fileExtension}`);
      return;
    }
    // --- End Validation ---

    setSelectedFile(file);
    // If validation passes, call the parent upload handler
    onFileUpload(event);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num);

  const getProgressStage = (progress) => {
    if (progress < 10) return 'เริ่มต้นการประมวลผล...';
    if (progress < 30) return 'กำลังอ่านและตรวจสอบไฟล์...';
    if (progress < 60) return 'กำลังตรวจสอบความถูกต้องของข้อมูล...';
    if (progress < 90) return 'กำลังบันทึกข้อมูลลงฐานข้อมูล...';
    if (progress < 100) return 'กำลังดำเนินการขั้นสุดท้าย...';
    return 'ประมวลผลสำเร็จ!';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">อัปโหลดไฟล์ Log (txt, csv, xlsx)</h2>
          <p className="text-sm text-gray-600 mt-1">
            รองรับไฟล์ขนาดใหญ่สูงสุด 500MB และ 2 ล้านรายการ
          </p>
        </div>
        {uploadStats && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดล่าสุด'}
          </button>
        )}
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-blue-500">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          ลากไฟล์มาวาง หรือเลือกไฟล์เพื่ออัปโหลด
        </p>
        <p className="text-gray-600">
          รองรับไฟล์ .csv, .xlsx, .xls (ข้อมูลจะถูกบันทึกต่อท้ายของเดิม)
        </p>
        
        <input
          type="file"
          accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileSelection}
          className="hidden"
          id="file-upload"
          // This key is a trick to allow re-uploading the same file
          key={selectedFile?.name || Date.now()}
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm"
        >
          {isUploading ? 'กำลังอัปโหลด...' : (selectedFile ? 'เลือกไฟล์ใหม่' : 'เลือกไฟล์')}
        </label>
      </div>

      {/* --- Display Area for File Status --- */}
      <div className="mt-4 space-y-4">
        {fileError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm font-medium">{fileError}</p>
          </div>
        )}

        {selectedFile && !fileError && !isUploading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
              <span className="text-xs text-blue-700">({formatFileSize(selectedFile.size)})</span>
            </div>
          </div>
        )}

        {isUploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{getProgressStage(uploadProgress)}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && !isUploading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">เกิดข้อผิดพลาดในการอัปโหลด</span>
            </div>
            <p className="text-red-700 mt-1 text-sm whitespace-pre-line">{uploadError}</p>
          </div>
        )}

        {logDataCount > 0 && !isUploading && !uploadError && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">อัปโหลดสำเร็จ! ข้อมูลพร้อมใช้งาน</span>
            </div>
            <p className="text-green-700 mt-1">
              ประมวลผลข้อมูลสำเร็จ {formatNumber(logDataCount)} รายการ
            </p>
            
            {uploadStats && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={<BarChart3 size={16} />} label="เวลาประมวลผล" value={uploadStats.processingTime || 'N/A'} />
                <StatCard icon={<CheckCircle size={16} />} label="สำเร็จ" value={uploadStats.successRate || '100%'} />
                <StatCard icon={<FileText size={16} />} label="ขนาดไฟล์" value={uploadStats.fileSize || 'N/A'} />
                <StatCard icon={<Clock size={16} />} label="อัปโหลดเมื่อ" value={uploadStats.uploadTime ? new Date(uploadStats.uploadTime).toLocaleString('th-TH') : 'เมื่อสักครู่'} />
              </div>
            )}
          </div>
        )}
      </div>

      {showDetails && uploadStats && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in">
          <h4 className="font-medium text-gray-900 mb-3">รายละเอียดการอัปโหลดล่าสุด</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">ข้อมูลไฟล์:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• ชื่อไฟล์: {uploadStats.fileName || 'N/A'}</li>
                <li>• ขนาด: {uploadStats.fileSize || 'N/A'}</li>
                <li>• จำนวนรายการทั้งหมด: {uploadStats.totalRecords ? formatNumber(uploadStats.totalRecords) : 'N/A'}</li>
                <li>• รายการที่บันทึก: {uploadStats.insertedRecords ? formatNumber(uploadStats.insertedRecords) : 'N/A'}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">สถิติการประมวลผล:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• สถานะ: {uploadStats.success ? '✅ สำเร็จ' : '❌ ล้มเหลว'}</li>
                <li>• คุณภาพข้อมูล: {uploadStats.dataQuality || 'ดี'}</li>
                <li>• อัปโหลดเมื่อ: {uploadStats.uploadTime ? new Date(uploadStats.uploadTime).toLocaleString('th-TH') : 'N/A'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border-t border-blue-200 rounded-b-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 เคล็ดลับและข้อมูล</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>ไฟล์ .xlsx อาจประมวลผลเร็วกว่า .csv สำหรับข้อมูลขนาดใหญ่</li>
          <li>ตรวจสอบให้แน่ใจว่าคอลัมน์สำคัญมีข้อมูลครบถ้วน</li>
          <li>ระบบจะข้ามข้อมูลที่ซ้ำกันโดยอัตโนมัติ (อ้างอิงจาก Transaction ID)</li>
          <li>สำหรับไฟล์ที่ใหญ่มาก แนะนำให้แบ่งเป็นไฟล์ย่อยๆ เพื่อการประมวลผลที่รวดเร็วขึ้น</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;

=======
// components/Upload/UploadPage.jsx
import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';

const UploadPage = ({ isUploading, uploadProgress, onFileUpload, logDataCount }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-4">อัปโหลดไฟล์ Log</h2>
    
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <div className="mb-4">
        <p className="text-lg font-medium text-gray-900 mb-2">
          เลือกไฟล์ .txt ที่ต้องการอัปโหลด
        </p>
        <p className="text-gray-600">
          รองรับไฟล์ขนาดสูงสุด 50MB
        </p>
      </div>
      
      <input
        type="file"
        accept=".txt"
        onChange={onFileUpload}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
      >
        เลือกไฟล์
      </label>
    </div>

    {isUploading && (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>กำลังอัปโหลด...</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      </div>
    )}

    {logDataCount > 0 && (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">ข้อมูลพร้อมใช้งาน</span>
        </div>
        <p className="text-green-700 mt-1">
          โหลดข้อมูลสำเร็จ {logDataCount} รายการ
        </p>
      </div>
    )}
  </div>
);

export default UploadPage;
>>>>>>> dccf88c7 (update case)
