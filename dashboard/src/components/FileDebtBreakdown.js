import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './FileDebtBreakdown.css';

const FileDebtBreakdown = ({ fileDebtMap, onFileSelect, onDebtItemClick }) => {
  const [sortBy, setSortBy] = useState('debtCount'); // 'debtCount', 'severity', 'name'
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [expandedFiles, setExpandedFiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search to improve performance with large file lists
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Performance optimization: Memoized file processing
  const fileEntries = useMemo(() => {
    if (!fileDebtMap || Object.keys(fileDebtMap).length === 0) return [];
    return Object.entries(fileDebtMap);
  }, [fileDebtMap]);

  // Convert fileDebtMap to sorted array with performance optimizations
  const processedFiles = useMemo(() => {
    if (fileEntries.length === 0) return [];

    setIsLoading(true);
    
    try {
      let files = fileEntries.map(([filePath, debtData]) => ({
        fullPath: filePath,
        fileName: filePath.split('/').pop(),
        directory: filePath.split('/').slice(0, -1).join('/'),
        debtCount: debtData.count || 0,
        severity: debtData.severity || 'p4',
        categories: debtData.categories || {},
        issues: debtData.issues || []
      }));

      // Filter by debounced search term
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        files = files.filter(file => 
          file.fileName.toLowerCase().includes(searchLower) ||
          file.directory.toLowerCase().includes(searchLower)
        );
      }

      // Filter by severity
      if (filterSeverity !== 'all') {
        files = files.filter(file => file.severity === filterSeverity);
      }

      // Sort files with memoized comparison function
      const severityOrder = { 'p1': 4, 'p2': 3, 'p3': 2, 'p4': 1 };
      
      files.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'debtCount':
            aValue = a.debtCount;
            bValue = b.debtCount;
            break;
          case 'severity':
            aValue = severityOrder[a.severity] || 0;
            bValue = severityOrder[b.severity] || 0;
            break;
          case 'name':
            aValue = a.fileName.toLowerCase();
            bValue = b.fileName.toLowerCase();
            break;
          default:
            aValue = a.debtCount;
            bValue = b.debtCount;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return files;
    } finally {
      // Use setTimeout to prevent blocking UI during processing
      setTimeout(() => setIsLoading(false), 0);
    }
  }, [fileEntries, debouncedSearchTerm, filterSeverity, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = processedFiles.slice(startIndex, startIndex + itemsPerPage);

  // Memoized callback functions for better performance
  const handleSort = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy, sortDirection]);

  const toggleFileExpansion = useCallback((filePath) => {
    setExpandedFiles(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(filePath)) {
        newExpanded.delete(filePath);
      } else {
        newExpanded.add(filePath);
      }
      return newExpanded;
    });
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e) => {
    setFilterSeverity(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of file list for better UX
    const fileList = document.querySelector('.file-list');
    if (fileList) {
      fileList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'p1': return '#ff4757';
      case 'p2': return '#ffa502';
      case 'p3': return '#3742fa';
      case 'p4': return '#7f8fa6';
      default: return '#7f8fa6';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'p1': return 'Critical';
      case 'p2': return 'High';
      case 'p3': return 'Medium';
      case 'p4': return 'Low';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'markdown': return '📝';
      case 'spelling': return '📚';
      case 'eslint-errors': return '🔧';
      case 'eslint-warnings': return '⚠️';
      case 'typescript': return '📘';
      case 'console-logs': return '🖥️';
      case 'todos': return '📋';
      case 'formatting': return '🎨';
      case 'security': return '🔒';
      case 'dependencies': return '📦';
      default: return '📄';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'markdown': return 'Markdown Issues';
      case 'spelling': return 'Spelling Errors';
      case 'eslint-errors': return 'ESLint Errors';
      case 'eslint-warnings': return 'ESLint Warnings';
      case 'typescript': return 'TypeScript Errors';
      case 'console-logs': return 'Console Logs';
      case 'todos': return 'TODO Comments';
      case 'formatting': return 'Formatting Issues';
      case 'security': return 'Security Issues';
      case 'dependencies': return 'Dependency Issues';
      default: return category;
    }
  };

  if (!fileDebtMap || Object.keys(fileDebtMap).length === 0) {
    return (
      <div className="file-debt-breakdown">
        <div className="breakdown-header">
          <h3>📁 File-Level Debt Breakdown</h3>
        </div>
        <div className="no-debt-files">
          <div className="no-debt-message">
            <span className="no-debt-icon">🎉</span>
            <h4>No File-Level Debt Detected</h4>
            <p>All files are debt-free! Keep up the excellent work!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-debt-breakdown ${isLoading ? 'loading' : ''}`}>
      <div className="breakdown-header">
        <h3>📁 File-Level Debt Breakdown</h3>
        <div className="breakdown-stats">
          <span className="stat-item">
            <strong>{processedFiles.length}</strong> files with debt
          </span>
          <span className="stat-item">
            <strong>{processedFiles.reduce((sum, file) => sum + file.debtCount, 0)}</strong> total issues
          </span>
          {isLoading && (
            <span className="stat-item loading-indicator">
              ⏳ Processing...
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="breakdown-controls">
        <div className="search-filter-row">
          <input
            type="text"
            placeholder="Search files..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="filter-select"
            value={filterSeverity}
            onChange={handleFilterChange}
          >
            <option value="all">All Severities</option>
            <option value="p1">Critical Only</option>
            <option value="p2">High Only</option>
            <option value="p3">Medium Only</option>
            <option value="p4">Low Only</option>
          </select>
        </div>
        
        <div className="sort-controls">
          <button
            className={`sort-button ${sortBy === 'debtCount' ? 'active' : ''}`}
            onClick={() => handleSort('debtCount')}
          >
            Sort by Debt Count {sortBy === 'debtCount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-button ${sortBy === 'severity' ? 'active' : ''}`}
            onClick={() => handleSort('severity')}
          >
            Sort by Severity {sortBy === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            Sort by Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="file-list">
        {paginatedFiles.map((file, index) => (
          <div key={file.fullPath} className="file-item">
            <div 
              className={`file-header ${file.severity}`}
              onClick={() => toggleFileExpansion(file.fullPath)}
            >
              <div className="file-info">
                <span className="expand-icon">
                  {expandedFiles.has(file.fullPath) ? '▼' : '▶'}
                </span>
                <span className="file-name">{file.fileName}</span>
                <span className="file-directory">{file.directory}</span>
              </div>
              <div className="file-metrics">
                <span className="debt-count">{file.debtCount} issues</span>
                <span 
                  className={`severity-badge ${file.severity}`}
                  style={{ backgroundColor: getSeverityColor(file.severity) }}
                >
                  {getSeverityLabel(file.severity)}
                </span>
              </div>
            </div>

            {expandedFiles.has(file.fullPath) && (
              <div className="file-details">
                <div className="file-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => onFileSelect && onFileSelect(file.fullPath)}
                  >
                    📂 View File
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => onDebtItemClick && onDebtItemClick(file.fullPath, 'auto-fix')}
                  >
                    🔧 Auto-Fix
                  </button>
                </div>
                
                <div className="debt-categories">
                  <h4>Issues by Category:</h4>
                  <div className="category-grid">
                    {Object.entries(file.categories).map(([category, count]) => (
                      <div 
                        key={category} 
                        className="category-item clickable"
                        onClick={() => onDebtItemClick && onDebtItemClick(file.fullPath, category)}
                      >
                        <span className="category-icon">{getCategoryIcon(category)}</span>
                        <span className="category-label">{getCategoryLabel(category)}</span>
                        <span className="category-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDebtBreakdown; 