import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { FollowUpSetting } from '../../domain/entities/FollowUp';

export interface FollowUpUsecases {
  getFollowUpSettings(user: UserSession): Promise<FollowUpSetting[]>;
  createFollowUpSetting(user: UserSession, setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting>;
  updateFollowUpSetting(user: UserSession, id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting>;
  deleteFollowUpSetting(user: UserSession, id: number): Promise<boolean>;
}
