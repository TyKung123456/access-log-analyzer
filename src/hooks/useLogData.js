<<<<<<< HEAD
// src/hooks/useLogData.js
import { useState, useEffect, useCallback } from 'react';
import { generateSampleData } from '../utils/sampleData';
import { processChartData, calculateStats } from '../utils/dataProcessing';
import apiService from '../services/apiService';

export const useLogData = () => {
  const [logData, setLogData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({ hourlyData: [], locationData: [], directionData: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });

  const useRealData = import.meta.env.VITE_ENABLE_SAMPLE_DATA !== 'true';

  const transformApiData = useCallback((item) => ({
    id: item['Transaction ID'] || item.id,
    dateTime: new Date(item['Date Time']),
    location: item.Location,
    direction: item.Direction,
    allow: item.Allow,
    cardName: item['Card Name'],
    userType: item['User Type'],
  }), []);

  const fetchAPIData = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: pagination.limit, ...filters };

      const [statsRes, chartsRes, logsRes] = await Promise.all([
        apiService.getStats(params),
        Promise.all([
          apiService.getChartData('hourly', params),
          apiService.getChartData('location', params),
          apiService.getChartData('direction', params)
        ]),
        apiService.getLogs(params)
      ]);

      setStats(statsRes);
      setChartData({
        hourlyData: chartsRes[0]?.data || [],
        locationData: chartsRes[1]?.data || [],
        directionData: chartsRes[2]?.data || []
      });
      
      const transformedLogs = logsRes.data.map(transformApiData);
      
      // ✅ FIXED: Update both logData and filteredData states.
      setLogData(transformedLogs);
      setFilteredData(transformedLogs);
      
      setPagination(logsRes.pagination);

    } catch (err) {
      console.error('❌ Failed to fetch real data:', err);
      setError('ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, transformApiData]);

  const fetchSampleData = useCallback(() => {
    const sample = generateSampleData();
    const transformedSample = sample.map(transformApiData);
    setLogData(transformedSample);
    setFilteredData(transformedSample);
    setStats(calculateStats(sample));
    setChartData(processChartData(sample));
  }, [transformApiData]);
  
  useEffect(() => {
    if (useRealData) {
      fetchAPIData(1, {});
    } else {
      fetchSampleData();
    }
  }, [useRealData, fetchAPIData, fetchSampleData]);

  const applyFilters = (filters) => {
    if (useRealData) {
      fetchAPIData(1, filters);
    }
  };
  
  return {
    // ✅ FIXED: Added 'logData' to the returned object.
    logData,
    filteredData,
    stats,
    chartData,
    loading,
    error,
    pagination,
    applyFilters,
    refreshData: fetchAPIData
  };
=======
import { useState, useEffect } from 'react';
import { generateSampleData } from '../utils/sampleData.js';
import { processChartData, calculateStats } from '../utils/dataProcessing.js';
import apiService from '../services/apiService.js';

export const useLogData = () => {
  const [logData, setLogData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    hourlyData: [],
    locationData: [],
    directionData: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0
  });

  const useRealData = import.meta.env.VITE_ENABLE_SAMPLE_DATA !== 'true';

  const convertFiltersToParams = (filters) => {
    const params = { page: 1, limit: pagination.limit };
    if (filters.dateRange) {
      params.startDate = filters.dateRange.start.toISOString();
      params.endDate = filters.dateRange.end.toISOString();
    }
    if (filters.location && filters.location.length > 0) params.location = filters.location;
    if (filters.direction && filters.direction.length > 0) params.direction = filters.direction;
    if (filters.allow !== undefined) params.allow = filters.allow;
    if (filters.search) params.search = filters.search;
    if (filters.user) params.user = filters.user;
    return params;
  };

  // FIXED: This function is updated to handle correct column names from the DB schema
  const transformApiData = (item) => ({
    id: item['Transaction ID'] || item.id,
    file: item.file,
    dateTime: new Date(item['Date Time']),
    day: item.day,
    month: item.month,
    year: item.year,
    yearMm: item.year_mm,
    transactionId: item['Transaction ID'],
    door: item.Door,
    device: item.Device,
    location: item.Location,
    direction: item.Direction,
    allow: item.Allow,
    reason: item.Reason,
    channel: item.Channel,
    cardName: item['Card Name'],
    cardNumber: item['Card Number Hash'],
    userType: item['User Type'],
    permission: item.Permission
  });

  const fetchRealData = async (filters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching real data from API...');
      const params = { ...convertFiltersToParams(filters), page };
      
      const response = await apiService.getLogs(params);
      
      // Use the new transformer function
      const transformedData = response.data.map(transformApiData);

      setLogData(transformedData);
      setFilteredData(transformedData);
      setPagination(response.pagination || { page: 1, limit: 100, total: transformedData.length, totalPages: 1 });

      await Promise.all([
        calculateStatsFromAPI(filters),
        processChartDataFromAPI(filters)
      ]);

      console.log('✅ Real data loaded:', transformedData.length, 'records');
    } catch (err) {
      console.error('❌ Failed to fetch real data:', err);
      setError(err.message);
      console.log('🔄 Falling back to sample data...');
      fetchSampleData(); // Fallback to sample data
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleData = () => {
    console.log('🔄 Using sample data...');
    const sampleData = generateSampleData();
    setLogData(sampleData);
    setFilteredData(sampleData);
    setStats(calculateStats(sampleData));
    setChartData(processChartData(sampleData));
  };

  const calculateStatsFromAPI = async (filters = {}) => {
    try {
      const params = convertFiltersToParams(filters);
      const apiStats = await apiService.getStats(params);
      setStats(apiStats);
    } catch (error) {
      console.warn('Failed to get stats from API, calculating locally');
      setStats(calculateStats(filteredData));
    }
  };

  const processChartDataFromAPI = async (filters = {}) => {
    try {
      const params = convertFiltersToParams(filters);
      const [hourlyResponse, locationResponse, directionResponse] = await Promise.all([
        apiService.getChartData('hourly', params),
        apiService.getChartData('location', params),
        apiService.getChartData('direction', params)
      ]);
      setChartData({
        hourlyData: transformHourlyData(hourlyResponse),
        locationData: locationResponse,
        directionData: directionResponse,
      });
    } catch (error) {
      console.warn('Failed to get chart data from API, processing locally');
      setChartData(processChartData(filteredData));
    }
  };
  
  const transformHourlyData = (hourlyData) => {
    if (!Array.isArray(hourlyData)) return [];
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    hourlyData.forEach(item => {
        const hourIndex = parseInt(item.hour, 10);
        if (hourIndex >= 0 && hourIndex < 24) {
            hours[hourIndex].count = parseInt(item.count, 10);
        }
    });
    return hours;
  };

  const checkAPIAvailability = async () => {
    try {
      const healthCheck = await apiService.healthCheck();
      return healthCheck.status === 'ok';
    } catch (error) {
      console.warn('API availability check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (useRealData) {
        const isAPIAvailable = await checkAPIAvailability();
        if (isAPIAvailable) {
          await fetchRealData();
        } else {
          console.warn('API not available, using sample data');
          fetchSampleData();
        }
      } else {
        fetchSampleData();
      }
    };
    initializeData();
  }, [useRealData]);

  const refreshData = (filters = {}) => {
    if (useRealData) {
      fetchRealData(filters, 1);
    } else {
      fetchSampleData();
    }
  };

  const loadMore = async () => {
    if (useRealData && pagination.page < pagination.totalPages) {
      const nextPage = pagination.page + 1;
      setLoading(true);
      try {
        const params = { page: nextPage, limit: pagination.limit };
        const response = await apiService.getLogs(params);
        
        // Use the new transformer function here as well
        const newData = response.data.map(transformApiData);

        setLogData(prev => [...prev, ...newData]);
        setFilteredData(prev => [...prev, ...newData]);
        setPagination(response.pagination || pagination);
      } catch (error) {
        console.error('Failed to load more data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const applyFilters = (filters) => {
    if (useRealData) {
      fetchRealData(filters, 1);
    } else {
      // Local filtering for sample data
      let filtered = logData.filter(item => {
          // Simplified filter logic
          const searchMatch = !filters.search || Object.values(item).some(val => String(val).toLowerCase().includes(filters.search.toLowerCase()));
          const locationMatch = !filters.location?.length || filters.location.includes(item.location);
          return searchMatch && locationMatch;
      });
      setFilteredData(filtered);
    }
  };

  return {
    logData,
    filteredData,
    stats: stats || {},
    chartData,
    loading,
    error,
    pagination,
    refreshData,
    loadMore,
    applyFilters,
    useRealData,
    hasMore: pagination.page < pagination.totalPages,
  };
>>>>>>> dccf88c7 (update case)
};