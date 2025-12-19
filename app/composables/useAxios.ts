import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'

let axiosInstance: AxiosInstance | null = null

const createApiInstance = (): AxiosInstance => {
	if (axiosInstance) return axiosInstance

	const config: AxiosRequestConfig = {
		baseURL: useRuntimeConfig().public.httpsEndpoint,
		timeout: 10000,
		headers: {
			'Content-Type': 'application/json'
		}
	}

	axiosInstance = axios.create(config)

	axiosInstance.interceptors.request.use(
		config => {
			const token = useCookie('accessToken').value
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}

			if (useRuntimeConfig().public.NUXT_PUBLIC_APP_ENVIRONMENT === 'development') {
				console.log('Request:', config.method?.toUpperCase(), config.url)
			}

			return config
		},
		(error: AxiosError) => {
			console.error('Request Error:', error)
			return Promise.reject(error)
		}
	)

	axiosInstance.interceptors.response.use(
		(response: AxiosResponse) => {
			if (useRuntimeConfig().public.NUXT_PUBLIC_APP_ENVIRONMENT === 'development') {
				console.log('Response Status:', response.status, 'Response URL:', response.config.url)
			}

			return response.data
		},
		(error: AxiosError) => {
			if (error.response) {
				const status = error.response.status

				switch (status) {
					case 401:
						console.error('Unauthorized - Token expired')
						useCookie('accessToken').value = null
						navigateTo({ name: 'auth-signin', query: { type: 'consumer' } })
						break

					case 403:
						console.error('Forbidden - No access')
						break

					case 404:
						console.error('Not Found')
						break

					case 500:
						console.error('Server Error')
						break

					default:
						console.error(`Error ${status}:`, error.message)
				}
			} else if (error.request) {
				console.error('Network Error - Cannot connect to server')
			} else {
				console.error('Error:', error.message)
			}

			return Promise.reject(error.response?.data)
		}
	)

	return axiosInstance
}

export const useAxios = () => {
	const api = createApiInstance()

	return {
		api,
		get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
		post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),
		put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),
		delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
		patch: (url: string, data?: any, config?: AxiosRequestConfig) => api.patch(url, data, config)
	}
}
