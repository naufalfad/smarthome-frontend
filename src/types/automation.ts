/**
 * PHASE 7: SMART HOME AUTOMATION ENGINE - FRONTEND TYPES
 */

export type TriggerType = 'SENSOR' | 'DEVICE_STATE' | 'SCHEDULED' | 'HYBRID';

export type TriggerMode = 'WHEN_CONDITION_BECOMES_TRUE' | 'WHILE_CONDITION_IS_TRUE' | 'SCHEDULED';

export type ConditionOperator = 'ALL' | 'ANY';

export type ComparisonOperator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'BETWEEN'
  | 'IN'
  | 'NOT_IN';

export interface SensorCondition {
  id?: string;
  type: 'SENSOR';
  deviceId: string;
  metric: 'temperature' | 'humidity' | 'aqi' | 'pm25' | 'pm10' | string;
  operator: ComparisonOperator;
  value: number;
  valueMax?: number;
  hysteresis?: number;
}

export interface DeviceStateCondition {
  id?: string;
  type: 'DEVICE_STATE';
  deviceId: string;
  property: 'power' | 'status' | 'brightness' | 'lockState' | 'targetTemperature' | 'mode' | 'fanSpeed' | string;
  operator: ComparisonOperator;
  value: boolean | string | number | Array<string | number>;
  valueMax?: number;
}

export interface TimeScheduleCondition {
  id?: string;
  type: 'TIME' | 'SCHEDULE';
  mode: 'AT_TIME' | 'AFTER_TIME' | 'BEFORE_TIME' | 'TIME_RANGE';
  time?: string; // "HH:mm"
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[]; // [0..6]
  timezone?: string;
}

export type RuleCondition = SensorCondition | DeviceStateCondition | TimeScheduleCondition;

export interface RuleAction {
  id?: string;
  deviceId: string;
  commandType: string;
  payload: Record<string, any>;
  description?: string;
}

export interface AutomationRule {
  id: string;
  houseId?: string | null;
  name: string;
  description?: string | null;
  enabled: boolean;
  priority: number;
  triggerType: TriggerType;
  triggerMode: TriggerMode;
  conditionOperator: ConditionOperator;
  conditions: RuleCondition[];
  actions: RuleAction[];
  cooldownSeconds: number;
  lastTriggeredAt?: string | null;
  lastExecutionStatus?: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'SKIPPED' | null;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  house?: { id: string; name: string };
  _count?: { executions: number };
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'SKIPPED';
  triggerData?: Record<string, any>;
  executionResult?: Array<{
    actionId?: string;
    deviceId: string;
    deviceName?: string;
    commandType: string;
    payload: Record<string, any>;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    commandId?: string;
    appliedConfig?: Record<string, any>;
    errorMessage?: string;
  }>;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
  rule?: {
    id: string;
    name: string;
    triggerType: string;
    priority: number;
  };
}

export interface ConditionEvaluationResult {
  condition: RuleCondition;
  isMet: boolean;
  actualValue?: any;
  targetValue?: any;
  message: string;
}

export interface DryRunTestResult {
  ruleName: string;
  isConditionMet: boolean;
  conditionOperator: ConditionOperator;
  conditionsEvaluated: ConditionEvaluationResult[];
  actionValidations: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    commandType: string;
    payload: Record<string, any>;
    isValid: boolean;
    reason?: string;
  }>;
  overallValid: boolean;
  warnings: string[];
}

export interface AutomationEngineStatus {
  isRunning: boolean;
  cycleCount: number;
  lastCycleAt: string | null;
  lastCycleDurationMs: number;
  activeRulesCount: number;
  totalExecutionsCount: number;
  cooldownActiveRules: number;
}

