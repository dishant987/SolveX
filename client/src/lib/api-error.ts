import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from './api-types';

export type ApiAxiosError = AxiosError<ApiErrorResponse>;
