
import { WalletData } from "./walletStorage";

export interface DcaPlan {
    id: string;
    walletId: string;
    tokenIn: string;
    tokenOut: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    active: boolean;
    lastExecuted?: number;
}

export class PlannerService {

    private static plans: DcaPlan[] = [];

    static createPlan(plan: DcaPlan) {
        this.plans.push(plan);
        // Persist to local storage or backend
        if (typeof window !== 'undefined') {
            localStorage.setItem('dca_plans', JSON.stringify(this.plans));
        }
    }

    static getPlans(): DcaPlan[] {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('dca_plans');
            if (stored) return JSON.parse(stored);
        }
        return [];
    }

    /**
     * Checks if any plan needs execution.
     * Since we are non-custodial and client-side (mostly),
     * we trigger this check when the user opens the app.
     */
    static checkDuePlans(): DcaPlan[] {
        const now = Date.now();
        const due: DcaPlan[] = [];
        const plans = this.getPlans();

        for (const plan of plans) {
            if (!plan.active) continue;

            const last = plan.lastExecuted || 0;
            let interval = 0;
            if (plan.frequency === 'daily') interval = 24 * 60 * 60 * 1000;
            if (plan.frequency === 'weekly') interval = 7 * 24 * 60 * 60 * 1000;
            if (plan.frequency === 'monthly') interval = 30 * 24 * 60 * 60 * 1000;

            if (now - last > interval) {
                due.push(plan);
            }
        }
        return due;
    }
}
