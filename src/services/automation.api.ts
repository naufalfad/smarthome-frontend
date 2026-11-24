/**
 * PHASE 7: SMART HOME AUTOMATION ENGINE - API CLIENT
 * Migrated to Phase 1 Shared Authenticated httpClient.
 */

import {
  AutomationRule,
  AutomationExecution,
  DryRunTestResult,
  AutomationEngineStatus,
} from '../types/automation';
import { httpClient } from './http-client';

class AutomationApiService {
  /**
   * Fetch all automation rules
   */
  public async getRules(filters: { houseId?: string; enabled?: boolean } = {}): Promise<AutomationRule[]> {
    const params = new URLSearchParams();
    if (filters.houseId) params.append('houseId', filters.houseId);
    if (filters.enabled !== undefined) params.append('enabled', String(filters.enabled));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<AutomationRule[]>(`/automations${qs}`, 'Failed to fetch automation rules');
  }

  /**
   * Fetch a single rule by ID
   */
  public async getRuleById(id: string): Promise<AutomationRule> {
    return httpClient.get<AutomationRule>(`/automations/${id}`, 'Failed to fetch automation rule');
  }

  /**
   * Create a new rule
   */
  public async createRule(data: Partial<AutomationRule>): Promise<AutomationRule> {
    return httpClient.post<AutomationRule>('/automations', data, 'Failed to create automation rule');
  }

  /**
   * Update an existing rule
   */
  public async updateRule(id: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
    return httpClient.put<AutomationRule>(`/automations/${id}`, data, 'Failed to update automation rule');
  }

  /**
   * Delete an existing rule
   */
  public async deleteRule(id: string): Promise<void> {
    await httpClient.delete(`/automations/${id}`, 'Failed to delete automation rule');
  }

  /**
   * Quick toggle enabled state
   */
  public async toggleRule(id: string, enabled?: boolean): Promise<AutomationRule> {
    return httpClient.patch<AutomationRule>(
      `/automations/${id}/toggle`,
      { enabled },
      'Failed to toggle automation rule'
    );
  }

  /**
   * Dry-run test an existing rule
   */
  public async testRule(id: string): Promise<DryRunTestResult> {
    return httpClient.post<DryRunTestResult>(`/automations/${id}/test`, undefined, 'Dry run test failed');
  }

  /**
   * Dry-run test a draft rule before saving
   */
  public async testDraftRule(draft: Partial<AutomationRule>): Promise<DryRunTestResult> {
    return httpClient.post<DryRunTestResult>('/automations/test', draft, 'Draft test failed');
  }

  /**
   * Get executions for a specific rule
   */
  public async getRuleExecutions(
    ruleId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ executions: AutomationExecution[]; total: number }> {
    const json = await httpClient.requestEnvelope<{
      success: boolean;
      data: AutomationExecution[];
      pagination: { total: number };
    }>(
      `/automations/${ruleId}/executions?limit=${limit}&offset=${offset}`,
      { method: 'GET' },
      'Failed to fetch rule executions'
    );
    return { executions: json.data, total: json.pagination.total };
  }

  /**
   * Get executions across all rules
   */
  public async getAllExecutions(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<{ executions: AutomationExecution[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) params.append('status', status);

    const json = await httpClient.requestEnvelope<{
      success: boolean;
      data: AutomationExecution[];
      pagination: { total: number };
    }>(
      `/automation-executions?${params.toString()}`,
      { method: 'GET' },
      'Failed to fetch executions'
    );
    return { executions: json.data, total: json.pagination.total };
  }

  /**
   * Get engine runtime status
   */
  public async getEngineStatus(): Promise<AutomationEngineStatus> {
    return httpClient.get<AutomationEngineStatus>('/automation/status', 'Failed to fetch engine status');
  }

  /**
   * Manually trigger evaluation cycle
   */
  public async triggerEvaluation(): Promise<any> {
    return httpClient.post<any>('/automation/evaluate', undefined, 'Failed to trigger evaluation');
  }
}

export const automationApi = new AutomationApiService();
