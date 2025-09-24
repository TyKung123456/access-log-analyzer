<<<<<<< HEAD
// src/services/uploadService.js - Refactored for Robustness and Performance
import apiService from './apiService.js';
import * as XLSX from 'xlsx';

class EnhancedUploadService {
  constructor() {
    this.MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit
    this.MAX_RECORDS = 2000000; // 2 million records limit
    this.VALIDATION_BATCH_SIZE = 2000; // Validate 2000 records at a time
    this.INSERT_BATCH_SIZE = 250; // Insert 250 records per batch to prevent timeout
  }

  /**
   * Main upload function.
   * NOTE: For optimal performance and to prevent UI blocking with very large files,
   * this entire function should be executed inside a Web Worker.
   * The worker would receive the file and post messages back with progress updates and the final result.
   */
  async uploadFile(file, progressCallback) {
    const startTime = Date.now();
    try {
      console.log('🚀 Starting large file upload process...');
      progressCallback(2, 'ตรวจสอบไฟล์...');

      // Phase 1: File validation
      this.validateFile(file);
      progressCallback(5, 'ตรวจสอบไฟล์สำเร็จ');

      // Phase 2: Parse file
      console.log('📖 Parsing large file...');
      const { rows, totalRows, headerMap } = await this.parseFile(file, progressCallback);
      progressCallback(25, 'อ่านไฟล์สำเร็จ');

      // Phase 3: Data validation
      console.log('🔍 Validating data...');
      const validationResult = await this.validateDataChunked(rows, headerMap, progressCallback, 25, 60);
      progressCallback(60, 'ตรวจสอบข้อมูลสำเร็จ');

      // Phase 4: Generate detailed preview
      const preview = this.generateDetailedPreview(validationResult, headerMap);
      progressCallback(65, 'สร้างตัวอย่างข้อมูล');

      // Phase 5: Database insertion
      console.log('💾 Inserting data...');
      const insertResult = await this.insertDataOptimized(validationResult.validRows, progressCallback, 65, 95);
      progressCallback(95, 'บันทึกข้อมูลใกล้เสร็จสิ้น');

      // Phase 6: Final Report
      const finalResult = this.createFinalReport(file, startTime, {
        totalRows,
        validationResult,
        insertResult,
        preview,
      });

      progressCallback(100, 'อัปโหลดสำเร็จ!');
      console.log('✅ Large file upload completed successfully:', finalResult.statistics);
      return finalResult;

    } catch (error) {
      console.error('❌ Large file upload failed:', error);
      progressCallback(0, 'การอัปโหลดล้มเหลว');
      // Rethrow a more user-friendly error message
      throw new Error(`การอัปโหลดไฟล์ล้มเหลว: ${error.message}`);
    }
  }

  // --- Phase 1: File Validation ---
  validateFile(file) {
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      throw new Error(`ประเภทไฟล์ไม่รองรับ (.${fileExtension}). กรุณาใช้ไฟล์ .xlsx, .xls หรือ .csv`);
    }
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    console.log('✅ File validation passed.');
  }

  // --- Phase 2: File Parsing ---
  async parseFile(file, progressCallback) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = 5 + (e.loaded / e.total) * 15; // Progress from 5% to 20%
          progressCallback(Math.round(progress), 'กำลังอ่านไฟล์...');
        }
      };

      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) throw new Error('ไม่พบแผ่นงาน (worksheet) ในไฟล์');
          
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });
          
          if (rows.length < 2) throw new Error('ไฟล์ต้องมีอย่างน้อย 1 header และ 1 แถวข้อมูล');

          const headers = rows[0].map(h => String(h || '').trim());
          const headerMap = this.validateAndMapHeaders(headers);
          
          const dataRows = rows.slice(1).map(rowArray => {
              const rowObj = {};
              headers.forEach((header, index) => {
                  if (header) rowObj[header] = rowArray[index];
              });
              return rowObj;
          });

          if (dataRows.length > this.MAX_RECORDS) {
            throw new Error(`ไฟล์มีข้อมูลมากเกินไป (สูงสุด ${this.MAX_RECORDS.toLocaleString()} แถว)`);
          }

          console.log(`✅ Parsed ${dataRows.length.toLocaleString()} rows.`);
          resolve({ rows: dataRows, totalRows: dataRows.length, headerMap });
        } catch (error) {
          reject(new Error(`ไม่สามารถอ่านไฟล์ได้: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดขณะอ่านไฟล์'));
      reader.readAsArrayBuffer(file);
    });
  }

  validateAndMapHeaders(headers) {
    const requiredHeaders = {
      'Date Time': 'dateTime',
      'Card Name': 'cardName',
      'Location': 'location'
    };
    const optionalHeaders = {
      'Allow': 'allow', 'Direction': 'direction', 'User Type': 'userType', 
      'Transaction ID': 'transactionId', 'Door': 'door', 'Device': 'device',
      'Reason': 'reason', 'Channel': 'channel', 'Card Number Hash': 'cardNumberHash',
      'ID Hash': 'idHash', 'User Hash': 'userHash', 'Permission': 'permission', 'Temp.': 'temp'
    };

    const headerMap = {};
    const lowerCaseHeaders = headers.map(h => h.toLowerCase());
    const allMappings = { ...requiredHeaders, ...optionalHeaders };
    
    // Check for required headers
    for (const [key, value] of Object.entries(requiredHeaders)) {
      const index = lowerCaseHeaders.indexOf(key.toLowerCase());
      if (index === -1) {
        throw new Error(`ขาดคอลัมน์ที่จำเป็น: "${key}"`);
      }
      headerMap[value] = headers[index]; // Map standard name to actual header name
    }
    
    // Map optional headers
    for (const [key, value] of Object.entries(optionalHeaders)) {
        const index = lowerCaseHeaders.indexOf(key.toLowerCase());
        if (index !== -1) {
            headerMap[value] = headers[index];
        }
    }
    
    console.log('✅ Headers validated and mapped:', headerMap);
    return headerMap;
  }

  // --- Phase 3: Data Validation ---
  async validateDataChunked(rows, headerMap, progressCallback, startProgress, endProgress) {
    const validRows = [];
    const errors = [];
    const warnings = [];
    const duplicateCheck = new Set();
    let skippedRows = 0;

    const totalChunks = Math.ceil(rows.length / this.VALIDATION_BATCH_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.VALIDATION_BATCH_SIZE;
      const end = start + this.VALIDATION_BATCH_SIZE;
      const chunk = rows.slice(start, end);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNumber = start + j + 2; // Excel row number

        if (this.isEmptyRow(row)) {
          skippedRows++;
          continue;
        }

        const validation = this.validateRow(row, rowNumber, headerMap, duplicateCheck);
        if (validation.errors.length > 0) {
          errors.push(...validation.errors);
          continue;
        }
        
        warnings.push(...validation.warnings);
        const cleanedRow = this.cleanRowData(row, headerMap);
        validRows.push(cleanedRow);

        // Add to duplicate check set
        if (cleanedRow.transactionId) {
            duplicateCheck.add(cleanedRow.transactionId);
        }
      }
      
      const progress = startProgress + ((i + 1) / totalChunks) * (endProgress - startProgress);
      progressCallback(Math.round(progress), `กำลังตรวจสอบข้อมูล (${i + 1}/${totalChunks})`);
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
    }

    console.log(`✅ Validation completed: ${validRows.length} valid, ${errors.length} errors.`);
    return { validRows, errors, warnings, skippedRows };
  }

  validateRow(row, rowNumber, headerMap, duplicateCheck) {
    const errors = [];
    const warnings = [];

    // Required fields check using headerMap
    if (!row[headerMap.dateTime]) errors.push(`แถวที่ ${rowNumber}: ขาดข้อมูล "Date Time"`);
    if (!row[headerMap.cardName]) errors.push(`แถวที่ ${rowNumber}: ขาดข้อมูล "Card Name"`);
    if (!row[headerMap.location]) errors.push(`แถวที่ ${rowNumber}: ขาดข้อมูล "Location"`);

    if (errors.length > 0) return { errors, warnings };
    
    // Date validation
    const dateValue = row[headerMap.dateTime];
    const parsedDate = this.parseFlexibleDate(dateValue);
    if (!parsedDate) {
      errors.push(`แถวที่ ${rowNumber}: รูปแบบวันที่ใน "Date Time" ไม่ถูกต้อง: "${dateValue}"`);
    } else if (parsedDate > new Date()) {
      warnings.push(`แถวที่ ${rowNumber}: วันที่เป็นวันในอนาคต: "${dateValue}"`);
    }

    // Duplicate check
    const transactionId = row[headerMap.transactionId];
    if (transactionId && duplicateCheck.has(String(transactionId).trim())) {
      warnings.push(`แถวที่ ${rowNumber}: Transaction ID "${transactionId}" ซ้ำซ้อนภายในไฟล์`);
    }

    return { errors, warnings };
  }
  
  isEmptyRow(row) {
    return Object.values(row).every(val => val === null || val === undefined || String(val).trim() === '');
  }

  // --- Data Cleaning ---
  cleanRowData(row, headerMap) {
    const cleaned = {};
    const h = headerMap; // Alias for brevity

    const parsedDate = this.parseFlexibleDate(row[h.dateTime]);

    // Map standard keys to cleaned values
    cleaned.dateTime = parsedDate.toISOString();
    cleaned.cardName = this.cleanString(row[h.cardName]);
    cleaned.location = this.cleanString(row[h.location]);
    cleaned.allow = this.parseBoolean(row[h.allow]);
    cleaned.direction = this.normalizeDirection(row[h.direction]);
    cleaned.userType = this.cleanString(row[h.userType]);
    cleaned.transactionId = this.cleanString(row[h.transactionId]);
    
    // Add computed date fields
    cleaned.day = parsedDate.getDate();
    cleaned.month = parsedDate.getMonth() + 1;
    cleaned.year = parsedDate.getFullYear();

    return cleaned;
  }
  
  // --- Phase 5: Data Insertion ---
  async insertDataOptimized(validRows, progressCallback, startProgress, endProgress) {
    if (validRows.length === 0) {
      return { insertedCount: 0, duplicatesSkipped: 0, failedBatches: [] };
    }
    
    let insertedCount = 0;
    let duplicatesSkipped = 0;
    const failedBatches = [];
    const totalBatches = Math.ceil(validRows.length / this.INSERT_BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
        const start = i * this.INSERT_BATCH_SIZE;
        const batch = validRows.slice(start, start + this.INSERT_BATCH_SIZE);
        try {
            const result = await apiService.appendLogData(batch);
            insertedCount += result.insertedCount || 0;
            duplicatesSkipped += result.duplicatesSkipped || 0;
        } catch (error) {
            console.error(`❌ Failed to insert batch ${i + 1}:`, error);
            failedBatches.push({ batchIndex: i, error: error.message });
        }
        const progress = startProgress + ((i + 1) / totalBatches) * (endProgress - startProgress);
        progressCallback(Math.round(progress), `กำลังบันทึกข้อมูล (${i + 1}/${totalBatches})`);
    }
    
    console.log(`✅ Insertion completed: ${insertedCount} inserted, ${failedBatches.length} failed batches.`);
    return { insertedCount, duplicatesSkipped, failedBatches };
  }

  // --- Phase 6: Final Report ---
  createFinalReport(file, startTime, results) {
    const { totalRows, validationResult, insertResult, preview } = results;
    const { validRows, errors, warnings, skippedRows } = validationResult;
    const { insertedCount, duplicatesSkipped, failedBatches } = insertResult;
    
    const processingTime = Date.now() - startTime;
    const success = errors.length === 0 && failedBatches.length === 0;

    let message = `ประมวลผลสำเร็จ! บันทึกข้อมูลใหม่ ${insertedCount.toLocaleString()} รายการ`;
    if (!success) {
        message = `ประมวลผลเสร็จสิ้น แต่พบปัญหา: บันทึกได้ ${insertedCount.toLocaleString()} รายการ, พบข้อผิดพลาด ${errors.length} แถว และ ${failedBatches.length} batch ล้มเหลว`;
    }
    
    return {
      success,
      message,
      statistics: {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        processingTime: `${(processingTime / 1000).toFixed(2)} วินาที`,
        totalRows,
        validRows: validRows.length,
        insertedRows: insertedCount,
        errorRows: errors.length,
        warningRows: warnings.length,
        skippedRows,
        duplicatesSkipped,
      },
      preview,
      errors: errors.slice(0, 50), // Show first 50 errors
      warnings: warnings.slice(0, 50),
    };
  }

  // --- Helper Functions ---
  parseFlexibleDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date && !isNaN(dateInput)) return dateInput;
    
    // For Excel numeric dates
    if (typeof dateInput === 'number' && dateInput > 1) {
        return new Date(Date.UTC(0, 0, dateInput - 1));
    }

    const dateString = String(dateInput).trim();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  cleanString(value) {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str === '' ? null : str;
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    const str = String(value || '').trim().toLowerCase();
    return ['true', 't', '1', 'yes', 'allow'].includes(str);
  }
  
  normalizeDirection(value) {
    const str = String(value || '').trim().toLowerCase();
    if (['in', 'enter', 'entry', 'เข้า'].includes(str)) return 'IN';
    if (['out', 'exit', 'ออก'].includes(str)) return 'OUT';
    return null;
  }
  
  // Placeholder for generateDetailedPreview, can be expanded as before
  generateDetailedPreview(validationResult, headerMap) {
    const { validRows } = validationResult;
    if (validRows.length === 0) return { sampleRows: [], summary: {} };
    return {
      sampleRows: validRows.slice(0, 10).map(row => {
          // Convert cleaned data back to original header format for display
          const displayRow = {};
          for (const key in headerMap) {
              displayRow[headerMap[key]] = row[key];
          }
          return displayRow;
      }),
      summary: {
        totalValid: validRows.length,
        // Other stats can be added here
      }
    };
  }
}

export default new EnhancedUploadService();
=======
// services/uploadService.js - Updated for Real Data (Fixed Import)
import apiService from './apiService.js'; // Now works because apiService.js exports default
import { parseLogFile } from '../utils/dataProcessing.js';

class UploadService {
  constructor() {
    this.useRealAPI = import.meta.env.VITE_ENABLE_SAMPLE_DATA !== 'true';
  }

  async uploadFile(file, progressCallback) {
    if (this.useRealAPI) {
      return this.uploadToAPI(file, progressCallback);
    } else {
      return this.simulateUpload(file, progressCallback);
    }
  }

  // Real API upload
  async uploadToAPI(file, progressCallback) {
    try {
      console.log('🔄 Uploading to real API...');
      
      progressCallback(10);
      
      // Check file size
      const maxSize = parseInt(import.meta.env.VITE_MAX_LOG_FILE_SIZE) || 52428800;
      if (file.size > maxSize) {
        throw new Error(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${Math.round(maxSize / 1024 / 1024)}MB)`);
      }

      progressCallback(20);

      // Upload file to API
      const result = await apiService.uploadLogFile(file, (progress) => {
        // API progress is 0-100, but we want to show 20-90 during upload
        const adjustedProgress = 20 + (progress * 0.7);
        progressCallback(Math.round(adjustedProgress));
      });

      progressCallback(95);

      // Wait a moment for database processing
      await this.delay(500);
      
      progressCallback(100);

      return {
        success: true,
        recordCount: result.recordCount || 0,
        message: result.message || 'อัปโหลดสำเร็จ',
        data: null // API handles data storage
      };

    } catch (error) {
      console.error('❌ API upload failed:', error);
      
      // Fallback to simulation if API fails
      console.log('🔄 Falling back to simulation...');
      return this.simulateUpload(file, progressCallback);
    }
  }

  // Simulated upload (for development/demo)
  async simulateUpload(file, progressCallback) {
    try {
      console.log('🔄 Simulating upload...');
      
      progressCallback(10);

      // Validate file type
      const allowedTypes = ['txt', 'log', 'csv'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        throw new Error('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ .txt, .log, .csv');
      }

      progressCallback(30);

      // Read and parse file content
      const content = await this.readFileContent(file);
      progressCallback(50);

      // Parse log data
      const parsedData = parseLogFile(content);
      progressCallback(70);

      // Simulate processing time
      await this.delay(1000);
      progressCallback(90);

      // Final delay
      await this.delay(500);
      progressCallback(100);

      return {
        success: true,
        recordCount: parsedData.length,
        message: 'จำลองการอัปโหลดสำเร็จ',
        data: parsedData
      };

    } catch (error) {
      throw new Error(`การอัปโหลดล้มเหลว: ${error.message}`);
    }
  }

  // Read file content
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      };
      
      reader.readAsText(file);
    });
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    // Check if file exists
    if (!file) {
      errors.push('ไม่มีไฟล์ที่เลือก');
      return errors;
    }

    // Check file size
    const maxSize = parseInt(import.meta.env.VITE_MAX_LOG_FILE_SIZE) || 52428800; // 50MB default
    if (file.size > maxSize) {
      errors.push(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    // Check file type
    const allowedTypes = ['txt', 'log', 'csv'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      errors.push('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ .txt, .log, .csv');
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('ไฟล์ว่างเปล่า');
    }

    return errors;
  }

  // Get file info
  getFileInfo(file) {
    if (!file) return null;

    return {
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      type: file.type,
      extension: file.name.split('.').pop().toLowerCase(),
      lastModified: new Date(file.lastModified)
    };
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if API is available
  async checkAPIStatus() {
    try {
      const status = await apiService.checkHealth();
      return status.status === 'ok';
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  // Get upload statistics
  async getUploadStats() {
    try {
      if (this.useRealAPI) {
        return await apiService.getUploadStats();
      } else {
        // Return mock stats for simulation mode
        return {
          totalFiles: 42,
          totalRecords: 15847,
          lastUpload: new Date().toISOString(),
          avgProcessingTime: 2.3
        };
      }
    } catch (error) {
      console.error('Failed to get upload stats:', error);
      return null;
    }
  }

  // Batch upload multiple files
  async uploadMultipleFiles(files, progressCallback) {
    const results = [];
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`🔄 Uploading file ${i + 1}/${totalFiles}: ${file.name}`);
      
      try {
        const result = await this.uploadFile(file, (fileProgress) => {
          // Calculate overall progress
          const fileWeight = 100 / totalFiles;
          const overallProgress = (i * fileWeight) + (fileProgress * fileWeight / 100);
          progressCallback(Math.round(overallProgress));
        });
        
        results.push({
          file: file.name,
          success: true,
          result
        });
        
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error.message
        });
      }
    }
    
    progressCallback(100);
    return results;
  }

  // Clean up old uploads (for demo/dev mode)
  async cleanupOldUploads() {
    try {
      if (this.useRealAPI) {
        return await apiService.request('/api/cleanup', {
          method: 'POST'
        });
      } else {
        console.log('🧹 Simulating cleanup...');
        return { cleaned: 0, message: 'Cleanup simulated' };
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }
}

export default new UploadService();
>>>>>>> dccf88c7 (update case)
