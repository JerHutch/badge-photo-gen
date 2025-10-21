/**
 * Budget tracking and validation functions
 */

import * as fs from 'fs/promises';
import YAML from 'yaml';
import { Config } from '../types';

/**
 * Check if estimated cost fits within remaining budget
 * @param config - The configuration object containing budget information
 * @param estimatedCost - The estimated cost of the operation
 * @returns Object with allowed flag and informative message
 */
export function checkBudget(
  config: Config,
  estimatedCost: number
): { allowed: boolean; message: string } {
  const remaining = config.budget.total - config.budget.spent;
  const allowed = remaining >= estimatedCost;

  // Calculate budget utilization percentage
  const utilizationPercent = (config.budget.spent / config.budget.total) * 100;
  const afterGenPercent = ((config.budget.spent + estimatedCost) / config.budget.total) * 100;

  let message = '';

  if (!allowed) {
    message = `Budget exceeded! Estimated cost ($${estimatedCost.toFixed(4)}) exceeds remaining budget ($${remaining.toFixed(4)}).\n`;
    message += `Total budget: $${config.budget.total.toFixed(4)} | Spent: $${config.budget.spent.toFixed(4)} | Remaining: $${remaining.toFixed(4)}`;
  } else {
    // Check if we're within the warning threshold
    const warnThresholdPercent = config.budget.warnThreshold * 100;

    if (afterGenPercent >= warnThresholdPercent) {
      message = `Warning: This generation will use ${afterGenPercent.toFixed(1)}% of your total budget.\n`;
      message += `Total budget: $${config.budget.total.toFixed(4)} | Spent: $${config.budget.spent.toFixed(4)} | Remaining: $${remaining.toFixed(4)}\n`;
      message += `Estimated cost: $${estimatedCost.toFixed(4)} | After generation: $${(config.budget.spent + estimatedCost).toFixed(4)}`;
    } else {
      message = `Budget check passed. Estimated cost: $${estimatedCost.toFixed(4)} | Remaining after: $${(remaining - estimatedCost).toFixed(4)}`;
    }
  }

  return { allowed, message };
}

/**
 * Update the spent amount in the budget configuration file
 * @param configPath - Path to the configuration file
 * @param amountSpent - Amount to add to the spent total
 */
export async function updateBudgetSpent(
  configPath: string,
  amountSpent: number
): Promise<void> {
  // Read the config file
  const configContent = await fs.readFile(configPath, 'utf-8');

  // Parse YAML
  const config: Config = YAML.parse(configContent);

  // Update the budget.spent field
  config.budget.spent += amountSpent;

  // Save the updated config back to the file
  const yamlContent = YAML.stringify(config);
  await fs.writeFile(configPath, yamlContent, 'utf-8');
}

/**
 * Format budget information for display
 * @param total - Total budget
 * @param spent - Amount already spent
 * @param estimated - Estimated cost for current operation
 * @returns Formatted string showing budget breakdown
 */
export function formatBudgetCheck(
  total: number,
  spent: number,
  estimated: number
): string {
  const remaining = total - spent;
  const afterGeneration = spent + estimated;
  const remainingAfter = remaining - estimated;

  const lines = [
    '=== Budget Overview ===',
    `Total Budget:       $${total.toFixed(4)}`,
    `Already Spent:      $${spent.toFixed(4)} (${((spent / total) * 100).toFixed(1)}%)`,
    `Remaining:          $${remaining.toFixed(4)} (${((remaining / total) * 100).toFixed(1)}%)`,
    '',
    `Estimated Cost:     $${estimated.toFixed(4)}`,
    `After Generation:   $${afterGeneration.toFixed(4)} (${((afterGeneration / total) * 100).toFixed(1)}%)`,
    `Remaining After:    $${remainingAfter.toFixed(4)} (${((remainingAfter / total) * 100).toFixed(1)}%)`,
    '======================'
  ];

  return lines.join('\n');
}
