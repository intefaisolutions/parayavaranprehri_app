import { apiRequest, toQueryString } from '../client';

export type TaskItem = {
  _id: string;
  taskTitle: string;
  description?: string;
  taskType?: string;
  assignedMitra?: string;
  vidhanSabha?: string;
  zone?: string;
  sector?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
};

export const tasksService = {
  list(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      taskType?: string;
      priority?: string;
      status?: string;
      vidhanSabha?: string;
      assignedMitra?: string;
    } = {},
  ) {
    return apiRequest<TaskItem[] | { items: TaskItem[]; meta: unknown }>(
      `/tasks/me${toQueryString(params)}`,
    );
  },

  getById(id: string) {
    return apiRequest<TaskItem>(`/tasks/${id}`);
  },

  updateStatus(
    id: string,
    status: 'Pending' | 'In Progress' | 'Completed',
    proof?: { description: string; mediaUrl?: string },
  ) {
    return apiRequest<TaskItem>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: { status, proofDescription: proof?.description, proofMediaUrl: proof?.mediaUrl },
    });
  },
};
