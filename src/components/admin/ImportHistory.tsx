/**
 * ImportHistory Component
 * Displays recent CSV imports in a table with filter and search
 * Part of the Admin Dashboard
 */

import React, { useMemo, useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { ImportHistoryItem } from '@/src/services/admin/dashboard.service';
import styles from './ImportHistory.module.css';

interface ImportHistoryProps {
  imports: ImportHistoryItem[];
  isLoading?: boolean;
  onViewDetails?: (importId: string) => void;
  onRollback?: (importId: string) => void;
}

export const ImportHistory: React.FC<ImportHistoryProps> = ({
  imports,
  isLoading = false,
  onViewDetails,
  onRollback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Filter and search logic
  const filteredImports = useMemo(() => {
    return imports.filter((item) => {
      const matchesSearch = item.filename
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [imports, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className="text-lg font-semibold">Import History</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredImports.length} imports
        </span>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <Input
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {/* Table */}
      {filteredImports.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No imports found</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Status</th>
                <th>Imported</th>
                <th>Duplicates</th>
                <th>Errors</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredImports.map((item) => (
                <tr key={item.id}>
                  <td className={styles.filenameCell}>{item.filename}</td>

                  <td>
                    <Badge
                      variant={getStatusVariant(item.status)}
                      label={item.status}
                    />
                  </td>

                  <td className={styles.numberCell}>
                    {item.successful_imports}
                  </td>

                  <td className={styles.numberCell}>{item.duplicate_count}</td>

                  <td className={styles.numberCell}>{item.error_count}</td>

                  <td className={styles.dateCell}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>

                  <td className={styles.actionsCell}>
                    {item.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewDetails?.(item.id)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRollback?.(item.id)}
                          title="Rollback"
                        >
                          <RotateCcw size={16} />
                        </Button>
                      </>
                    )}
                    {item.status !== 'completed' && (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/**
 * Get badge variant based on import status
 */
function getStatusVariant(
  status: string
): 'primary' | 'secondary' | 'danger' | 'success' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'failed':
      return 'danger';
    case 'queued':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default ImportHistory;
