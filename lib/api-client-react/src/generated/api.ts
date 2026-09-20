= getListFeedbackReportsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateFeedbackReportUrl = (reportId: number,) => {




  return `/api/feedback/reports/${reportId}`
}

/**
 * @summary Resolve a feedback report
 */
export const updateFeedbackReport = async (reportId: number,
    feedbackReportUpdate: FeedbackReportUpdate, options?: Parameters<typeof customFetch>[1]): Promise<FeedbackReport> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<FeedbackReport>(getUpdateFeedbackReportUrl(reportId),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(feedbackReportUpdate)
  }
);}





export const getUpdateFeedbackReportMutationKey = () => ['updateFeedbackReport'] as const;

export const getUpdateFeedbackReportMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateFeedbackReport>>, TError,UpdateFeedbackReportMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateFeedbackReport>>, TError,UpdateFeedbackReportMutationVariables, TContext> => {

const mutationKey = getUpdateFeedbackReportMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateFeedbackReport>>, UpdateFeedbackReportMutationVariables> = (props) => {
          const {reportId,data} = props ?? {};

          return  updateFeedbackReport(reportId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateFeedbackReportMutationResult = NonNullable<Awaited<ReturnType<typeof updateFeedbackReport>>>
    export type UpdateFeedbackReportMutationBody = BodyType<FeedbackReportUpdate>
    export type UpdateFeedbackReportMutationError = ErrorType<void>
    export type UpdateFeedbackReportMutationVariables = {reportId: number;data: BodyType<FeedbackReportUpdate>}

    /**
 * @summary Resolve a feedback report
 */
export const useUpdateFeedbackReport = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateFeedbackReport>>, TError,UpdateFeedbackReportMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateFeedbackReport>>,
        TError,
        UpdateFeedbackReportMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateFeedbackReportMutationOptions(options));
    }

export const getUpdateWebsiteUrl = (websiteId: number,) => {




  return `/api/websites/${websiteId}`
}

/**
 * @summary Update a website
 */
export const updateWebsite = async (websiteId: number,
    websiteUpdate: WebsiteUpdate, options?: Parameters<typeof customFetch>[1]): Promise<Website> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<Website>(getUpdateWebsiteUrl(websiteId),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(websiteUpdate)
  }
);}





export const getUpdateWebsiteMutationKey = () => ['updateWebsite'] as const;

export const getUpdateWebsiteMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateWebsite>>, TError,UpdateWebsiteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateWebsite>>, TError,UpdateWebsiteMutationVariables, TContext> => {

const mutationKey = getUpdateWebsiteMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateWebsite>>, UpdateWebsiteMutationVariables> = (props) => {
          const {websiteId,data} = props ?? {};

          return  updateWebsite(websiteId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateWebsiteMutationResult = NonNullable<Awaited<ReturnType<typeof updateWebsite>>>
    export type UpdateWebsiteMutationBody = BodyType<WebsiteUpdate>
    export type UpdateWebsiteMutationError = ErrorType<void>
    export type UpdateWebsiteMutationVariables = {websiteId: number;data: BodyType<WebsiteUpdate>}

    /**
 * @summary Update a website
 */
export const useUpdateWebsite = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateWebsite>>, TError,UpdateWebsiteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateWebsite>>,
        TError,
        UpdateWebsiteMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateWebsiteMutationOptions(options));
    }

export const getDeleteWebsiteUrl = (websiteId: number,) => {




  return `/api/websites/${websiteId}`
}

/**
 * @summary Remove a website
 */
export const deleteWebsite = async (websiteId: number, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getDeleteWebsiteUrl(websiteId),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getDeleteWebsiteMutationKey = () => ['deleteWebsite'] as const;

export const getDeleteWebsiteMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteWebsite>>, TError,DeleteWebsiteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteWebsite>>, TError,DeleteWebsiteMutationVariables, TContext> => {

const mutationKey = getDeleteWebsiteMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteWebsite>>, DeleteWebsiteMutationVariables> = (props) => {
          const {websiteId} = props ?? {};

          return  deleteWebsite(websiteId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteWebsiteMutationResult = NonNullable<Awaited<ReturnType<typeof deleteWebsite>>>

    export type DeleteWebsiteMutationError = ErrorType<void>
    export type DeleteWebsiteMutationVariables = {websiteId: number}

    /**
 * @summary Remove a website
 */
export const useDeleteWebsite = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteWebsite>>, TError,DeleteWebsiteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof deleteWebsite>>,
        TError,
        DeleteWebsiteMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteWebsiteMutationOptions(options));
    }

export const getGetDashboardSummaryUrl = () => {




  return `/api/dashboard/summary`
}

/**
 * @summary Get dashboard summary
 */
export const getDashboardSummary = async ( options?: Parameters<typeof customFetch>[1]): Promise<DashboardSummary> => {

  return customFetch<DashboardSummary>(getGetDashboardSummaryUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetDashboardSummaryQueryKey = () => {
    return [
    `/api/dashboard/summary`
    ] as const;
    }


export const getGetDashboardSummaryQueryOptions = <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetDashboardSummaryQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getDashboardSummary>>> = ({ signal }) => getDashboardSummary({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & { queryKey: QueryKey }
}

export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>
export type GetDashboardSummaryQueryError = ErrorType<void>


/**
 * @summary Get dashboard summary
 */

export function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getGetDashboardSummaryQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListActivityUrl = () => {




  return `/api/dashboard/activity`
}

/**
 * @summary List recent activity
 */
export const listActivity = async ( options?: Parameters<typeof customFetch>[1]): Promise<Activity[]> => {

  return customFetch<Activity[]>(getListActivityUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListActivityQueryKey = () => {
    return [
    `/api/dashboard/activity`
    ] as const;
    }


export const getListActivityQueryOptions = <TData = Awaited<ReturnType<typeof listActivity>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listActivity>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListActivityQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listActivity>>> = ({ signal }) => listActivity({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listActivity>>, TError, TData> & { queryKey: QueryKey }
}

export type ListActivityQueryResult = NonNullable<Awaited<ReturnType<typeof listActivity>>>
export type ListActivityQueryError = ErrorType<void>


/**
 * @summary List recent activity
 */

export function useListActivity<TData = Awaited<ReturnType<typeof listActivity>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listActivity>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListActivityQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListAdminActivityUrl = () => {




  return `/api/admin/activity`
}

/**
 * @summary List the administrator audit log
 */
export const listAdminActivity = async ( options?: Parameters<typeof customFetch>[1]): Promise<Activity[]> => {

  return customFetch<Activity[]>(getListAdminActivityUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListAdminActivityQueryKey = () => {
    return [
    `/api/admin/activity`
    ] as const;
    }


export const getListAdminActivityQueryOptions = <TData = Awaited<ReturnType<typeof listAdminActivity>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminActivity>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAdminActivityQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAdminActivity>>> = ({ signal }) => listAdminActivity({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAdminActivity>>, TError, TData> & { queryKey: QueryKey }
}

export type ListAdminActivityQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminActivity>>>
export type ListAdminActivityQueryError = ErrorType<void>


/**
 * @summary List the administrator audit log
 */

export function useListAdminActivity<TData = Awaited<ReturnType<typeof listAdminActivity>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminActivity>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListAdminActivityQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListMemberFavoritesUrl = () => {




  return `/api/member/favorites`
}

/**
 * @summary List the current member's favorite websites
 */
export const listMemberFavorites = async ( options?: Parameters<typeof customFetch>[1]): Promise<Website[]> => {

  return customFetch<Website[]>(getListMemberFavoritesUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListMemberFavoritesQueryKey = () => {
    return [
    `/api/member/favorites`
    ] as const;
    }


export const getListMemberFavoritesQueryOptions = <TData = Awaited<ReturnType<typeof listMemberFavorites>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberFavorites>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMemberFavoritesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMemberFavorites>>> = ({ signal }) => listMemberFavorites({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMemberFavorites>>, TError, TData> & { queryKey: QueryKey }
}

export type ListMemberFavoritesQueryResult = NonNullable<Awaited<ReturnType<typeof listMemberFavorites>>>
export type ListMemberFavoritesQueryError = ErrorType<void>


/**
 * @summary List the current member's favorite websites
 */

export function useListMemberFavorites<TData = Awaited<ReturnType<typeof listMemberFavorites>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberFavorites>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListMemberFavoritesQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getCreateMemberFavoriteUrl = (websiteId: number,) => {




  return `/api/member/favorites/${websiteId}`
}

/**
 * @summary Save a website to the member's favorites
 */
export const createMemberFavorite = async (websiteId: number, options?: Parameters<typeof customFetch>[1]): Promise<Website> => {

  return customFetch<Website>(getCreateMemberFavoriteUrl(websiteId),
  {
    ...options,
    method: 'POST'


  }
);}





export const getCreateMemberFavoriteMutationKey = () => ['createMemberFavorite'] as const;

export const getCreateMemberFavoriteMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMemberFavorite>>, TError,CreateMemberFavoriteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createMemberFavorite>>, TError,CreateMemberFavoriteMutationVariables, TContext> => {

const mutationKey = getCreateMemberFavoriteMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createMemberFavorite>>, CreateMemberFavoriteMutationVariables> = (props) => {
          const {websiteId} = props ?? {};

          return  createMemberFavorite(websiteId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateMemberFavoriteMutationResult = NonNullable<Awaited<ReturnType<typeof createMemberFavorite>>>

    export type CreateMemberFavoriteMutationError = ErrorType<void>
    export type CreateMemberFavoriteMutationVariables = {websiteId: number}

    /**
 * @summary Save a website to the member's favorites
 */
export const useCreateMemberFavorite = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMemberFavorite>>, TError,CreateMemberFavoriteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createMemberFavorite>>,
        TError,
        CreateMemberFavoriteMutationVariables,
        TContext
      > => {
      return useMutation(getCreateMemberFavoriteMutationOptions(options));
    }

export const getDeleteMemberFavoriteUrl = (websiteId: number,) => {




  return `/api/member/favorites/${websiteId}`
}

/**
 * @summary Remove a website from the member's favorites
 */
export const deleteMemberFavorite = async (websiteId: number, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getDeleteMemberFavoriteUrl(websiteId),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getDeleteMemberFavoriteMutationKey = () => ['deleteMemberFavorite'] as const;

export const getDeleteMemberFavoriteMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteMemberFavorite>>, TError,DeleteMemberFavoriteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteMemberFavorite>>, TError,DeleteMemberFavoriteMutationVariables, TContext> => {

const mutationKey = getDeleteMemberFavoriteMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteMemberFavorite>>, DeleteMemberFavoriteMutationVariables> = (props) => {
          const {websiteId} = props ?? {};

          return  deleteMemberFavorite(websiteId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteMemberFavoriteMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMemberFavorite>>>

    export type DeleteMemberFavoriteMutationError = ErrorType<void>
    export type DeleteMemberFavoriteMutationVariables = {websiteId: number}

    /**
 * @summary Remove a website from the member's favorites
 */
export const useDeleteMemberFavorite = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteMemberFavorite>>, TError,DeleteMemberFavoriteMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof deleteMemberFavorite>>,
        TError,
        DeleteMemberFavoriteMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteMemberFavoriteMutationOptions(options));
    }

export const getListMemberRequestsUrl = () => {




  return `/api/member/requests`
}

/**
 * @summary List the current member's project requests
 */
export const listMemberRequests = async ( options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest[]> => {

  return customFetch<MemberRequest[]>(getListMemberRequestsUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListMemberRequestsQueryKey = () => {
    return [
    `/api/member/requests`
    ] as const;
    }


export const getListMemberRequestsQueryOptions = <TData = Awaited<ReturnType<typeof listMemberRequests>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberRequests>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMemberRequestsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMemberRequests>>> = ({ signal }) => listMemberRequests({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMemberRequests>>, TError, TData> & { queryKey: QueryKey }
}

export type ListMemberRequestsQueryResult = NonNullable<Awaited<ReturnType<typeof listMemberRequests>>>
export type ListMemberRequestsQueryError = ErrorType<void>


/**
 * @summary List the current member's project requests
 */

export function useListMemberRequests<TData = Awaited<ReturnType<typeof listMemberRequests>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberRequests>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListMemberRequestsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getCreateMemberRequestUrl = () => {




  return `/api/member/requests`
}

/**
 * @summary Send a project request to the administrator
 */
export const createMemberRequest = async (memberRequestInput: MemberRequestInput, options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<MemberRequest>(getCreateMemberRequestUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(memberRequestInput)
  }
);}





export const getCreateMemberRequestMutationKey = () => ['createMemberRequest'] as const;

export const getCreateMemberRequestMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMemberRequest>>, TError,CreateMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createMemberRequest>>, TError,CreateMemberRequestMutationVariables, TContext> => {

const mutationKey = getCreateMemberRequestMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createMemberRequest>>, CreateMemberRequestMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  createMemberRequest(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateMemberRequestMutationResult = NonNullable<Awaited<ReturnType<typeof createMemberRequest>>>
    export type CreateMemberRequestMutationBody = BodyType<MemberRequestInput>
    export type CreateMemberRequestMutationError = ErrorType<void>
    export type CreateMemberRequestMutationVariables = {data: BodyType<MemberRequestInput>}

    /**
 * @summary Send a project request to the administrator
 */
export const useCreateMemberRequest = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createMemberRequest>>, TError,CreateMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createMemberRequest>>,
        TError,
        CreateMemberRequestMutationVariables,
        TContext
      > => {
      return useMutation(getCreateMemberRequestMutationOptions(options));
    }

export const getListMemberRequestHistoryUrl = (requestId: number,) => {




  return `/api/member/requests/${requestId}/history`
}

/**
 * @summary List the status history of a member request
 */
export const listMemberRequestHistory = async (requestId: number, options?: Parameters<typeof customFetch>[1]): Promise<MemberRequestHistory[]> => {

  return customFetch<MemberRequestHistory[]>(getListMemberRequestHistoryUrl(requestId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListMemberRequestHistoryQueryKey = (requestId: number,) => {
    return [
    `/api/member/requests/${requestId}/history`
    ] as const;
    }


export const getListMemberRequestHistoryQueryOptions = <TData = Awaited<ReturnType<typeof listMemberRequestHistory>>, TError = ErrorType<void>>(requestId: number, options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberRequestHistory>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMemberRequestHistoryQueryKey(requestId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMemberRequestHistory>>> = ({ signal }) => listMemberRequestHistory(requestId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: requestId !== null && requestId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMemberRequestHistory>>, TError, TData> & { queryKey: QueryKey }
}

export type ListMemberRequestHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof listMemberRequestHistory>>>
export type ListMemberRequestHistoryQueryError = ErrorType<void>


/**
 * @summary List the status history of a member request
 */

export function useListMemberRequestHistory<TData = Awaited<ReturnType<typeof listMemberRequestHistory>>, TError = ErrorType<void>>(
 requestId: number, options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberRequestHistory>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListMemberRequestHistoryQueryOptions(requestId,options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateMemberRequestUrl = (requestId: number,) => {




  return `/api/member/requests/${requestId}`
}

/**
 * @summary Add a message to a member request
 */
export const updateMemberRequest = async (requestId: number,
    memberRequestUpdate: MemberRequestUpdate, options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<MemberRequest>(getUpdateMemberRequestUrl(requestId),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(memberRequestUpdate)
  }
);}





export const getUpdateMemberRequestMutationKey = () => ['updateMemberRequest'] as const;

export const getUpdateMemberRequestMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequest>>, TError,UpdateMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequest>>, TError,UpdateMemberRequestMutationVariables, TContext> => {

const mutationKey = getUpdateMemberRequestMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateMemberRequest>>, UpdateMemberRequestMutationVariables> = (props) => {
          const {requestId,data} = props ?? {};

          return  updateMemberRequest(requestId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateMemberRequestMutationResult = NonNullable<Awaited<ReturnType<typeof updateMemberRequest>>>
    export type UpdateMemberRequestMutationBody = BodyType<MemberRequestUpdate>
    export type UpdateMemberRequestMutationError = ErrorType<void>
    export type UpdateMemberRequestMutationVariables = {requestId: number;data: BodyType<MemberRequestUpdate>}

    /**
 * @summary Add a message to a member request
 */
export const useUpdateMemberRequest = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequest>>, TError,UpdateMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateMemberRequest>>,
        TError,
        UpdateMemberRequestMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateMemberRequestMutationOptions(options));
    }

export const getWithdrawMemberRequestUrl = (requestId: number,) => {




  return `/api/member/requests/${requestId}`
}

/**
 * @summary Withdraw the current member's request
 */
export const withdrawMemberRequest = async (requestId: number, options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest> => {

  return customFetch<MemberRequest>(getWithdrawMemberRequestUrl(requestId),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getWithdrawMemberRequestMutationKey = () => ['withdrawMemberRequest'] as const;

export const getWithdrawMemberRequestMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof withdrawMemberRequest>>, TError,WithdrawMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof withdrawMemberRequest>>, TError,WithdrawMemberRequestMutationVariables, TContext> => {

const mutationKey = getWithdrawMemberRequestMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof withdrawMemberRequest>>, WithdrawMemberRequestMutationVariables> = (props) => {
          const {requestId} = props ?? {};

          return  withdrawMemberRequest(requestId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type WithdrawMemberRequestMutationResult = NonNullable<Awaited<ReturnType<typeof withdrawMemberRequest>>>

    export type WithdrawMemberRequestMutationError = ErrorType<void>
    export type WithdrawMemberRequestMutationVariables = {requestId: number}

    /**
 * @summary Withdraw the current member's request
 */
export const useWithdrawMemberRequest = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof withdrawMemberRequest>>, TError,WithdrawMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof withdrawMemberRequest>>,
        TError,
        WithdrawMemberRequestMutationVariables,
        TContext
      > => {
      return useMutation(getWithdrawMemberRequestMutationOptions(options));
    }

export const getListMemberNotificationsUrl = () => {




  return `/api/member/notifications`
}

/**
 * @summary List the current member's notifications
 */
export const listMemberNotifications = async ( options?: Parameters<typeof customFetch>[1]): Promise<MemberNotification[]> => {

  return customFetch<MemberNotification[]>(getListMemberNotificationsUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListMemberNotificationsQueryKey = () => {
    return [
    `/api/member/notifications`
    ] as const;
    }


export const getListMemberNotificationsQueryOptions = <TData = Awaited<ReturnType<typeof listMemberNotifications>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberNotifications>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMemberNotificationsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMemberNotifications>>> = ({ signal }) => listMemberNotifications({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMemberNotifications>>, TError, TData> & { queryKey: QueryKey }
}

export type ListMemberNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listMemberNotifications>>>
export type ListMemberNotificationsQueryError = ErrorType<void>


/**
 * @summary List the current member's notifications
 */

export function useListMemberNotifications<TData = Awaited<ReturnType<typeof listMemberNotifications>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMemberNotifications>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListMemberNotificationsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getMarkMemberNotificationReadUrl = (notificationId: number,) => {




  return `/api/member/notifications/${notificationId}/read`
}

/**
 * @summary Mark a member notification as read
 */
export const markMemberNotificationRead = async (notificationId: number, options?: Parameters<typeof customFetch>[1]): Promise<MemberNotification> => {

  return customFetch<MemberNotification>(getMarkMemberNotificationReadUrl(notificationId),
  {
    ...options,
    method: 'PATCH'


  }
);}





export const getMarkMemberNotificationReadMutationKey = () => ['markMemberNotificationRead'] as const;

export const getMarkMemberNotificationReadMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof markMemberNotificationRead>>, TError,MarkMemberNotificationReadMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof markMemberNotificationRead>>, TError,MarkMemberNotificationReadMutationVariables, TContext> => {

const mutationKey = getMarkMemberNotificationReadMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof markMemberNotificationRead>>, MarkMemberNotificationReadMutationVariables> = (props) => {
          const {notificationId} = props ?? {};

          return  markMemberNotificationRead(notificationId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type MarkMemberNotificationReadMutationResult = NonNullable<Awaited<ReturnType<typeof markMemberNotificationRead>>>

    export type MarkMemberNotificationReadMutationError = ErrorType<void>
    export type MarkMemberNotificationReadMutationVariables = {notificationId: number}

    /**
 * @summary Mark a member notification as read
 */
export const useMarkMemberNotificationRead = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof markMemberNotificationRead>>, TError,MarkMemberNotificationReadMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof markMemberNotificationRead>>,
        TError,
        MarkMemberNotificationReadMutationVariables,
        TContext
      > => {
      return useMutation(getMarkMemberNotificationReadMutationOptions(options));
    }

export const getGetMemberProfileUrl = () => {




  return `/api/member/profile`
}

/**
 * @summary Get the current member profile settings
 */
export const getMemberProfile = async ( options?: Parameters<typeof customFetch>[1]): Promise<MemberProfile> => {

  return customFetch<MemberProfile>(getGetMemberProfileUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetMemberProfileQueryKey = () => {
    return [
    `/api/member/profile`
    ] as const;
    }


export const getGetMemberProfileQueryOptions = <TData = Awaited<ReturnType<typeof getMemberProfile>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getMemberProfile>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetMemberProfileQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getMemberProfile>>> = ({ signal }) => getMemberProfile({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getMemberProfile>>, TError, TData> & { queryKey: QueryKey }
}

export type GetMemberProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getMemberProfile>>>
export type GetMemberProfileQueryError = ErrorType<void>


/**
 * @summary Get the current member profile settings
 */

export function useGetMemberProfile<TData = Awaited<ReturnType<typeof getMemberProfile>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getMemberProfile>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getGetMemberProfileQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateMemberProfileUrl = () => {




  return `/api/member/profile`
}

/**
 * @summary Update the current member profile settings
 */
export const updateMemberProfile = async (memberProfileUpdate: MemberProfileUpdate, options?: Parameters<typeof customFetch>[1]): Promise<MemberProfile> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<MemberProfile>(getUpdateMemberProfileUrl(),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(memberProfileUpdate)
  }
);}





export const getUpdateMemberProfileMutationKey = () => ['updateMemberProfile'] as const;

export const getUpdateMemberProfileMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberProfile>>, TError,UpdateMemberProfileMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateMemberProfile>>, TError,UpdateMemberProfileMutationVariables, TContext> => {

const mutationKey = getUpdateMemberProfileMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateMemberProfile>>, UpdateMemberProfileMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  updateMemberProfile(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateMemberProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateMemberProfile>>>
    export type UpdateMemberProfileMutationBody = BodyType<MemberProfileUpdate>
    export type UpdateMemberProfileMutationError = ErrorType<void>
    export type UpdateMemberProfileMutationVariables = {data: BodyType<MemberProfileUpdate>}

    /**
 * @summary Update the current member profile settings
 */
export const useUpdateMemberProfile = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberProfile>>, TError,UpdateMemberProfileMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateMemberProfile>>,
        TError,
        UpdateMemberProfileMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateMemberProfileMutationOptions(options));
    }

export const getListManagedMemberRequestsUrl = () => {




  return `/api/requests/manage`
}

/**
 * @summary List member requests for administrators
 */
export const listManagedMemberRequests = async ( options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest[]> => {

  return customFetch<MemberRequest[]>(getListManagedMemberRequestsUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListManagedMemberRequestsQueryKey = () => {
    return [
    `/api/requests/manage`
    ] as const;
    }


export const getListManagedMemberRequestsQueryOptions = <TData = Awaited<ReturnType<typeof listManagedMemberRequests>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listManagedMemberRequests>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListManagedMemberRequestsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listManagedMemberRequests>>> = ({ signal }) => listManagedMemberRequests({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listManagedMemberRequests>>, TError, TData> & { queryKey: QueryKey }
}

export type ListManagedMemberRequestsQueryResult = NonNullable<Awaited<ReturnType<typeof listManagedMemberRequests>>>
export type ListManagedMemberRequestsQueryError = ErrorType<void>


/**
 * @summary List member requests for administrators
 */

export function useListManagedMemberRequests<TData = Awaited<ReturnType<typeof listManagedMemberRequests>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listManagedMemberRequests>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListManagedMemberRequestsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateMemberRequestStatusUrl = (requestId: number,) => {




  return `/api/requests/${requestId}/status`
}

/**
 * @summary Update a member request status
 */
export const updateMemberRequestStatus = async (requestId: number,
    memberRequestStatusUpdate: MemberRequestStatusUpdate, options?: Parameters<typeof customFetch>[1]): Promise<MemberRequest> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<MemberRequest>(getUpdateMemberRequestStatusUrl(requestId),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(memberRequestStatusUpdate)
  }
);}





export const getUpdateMemberRequestStatusMutationKey = () => ['updateMemberRequestStatus'] as const;

export const getUpdateMemberRequestStatusMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequestStatus>>, TError,UpdateMemberRequestStatusMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequestStatus>>, TError,UpdateMemberRequestStatusMutationVariables, TContext> => {

const mutationKey = getUpdateMemberRequestStatusMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateMemberRequestStatus>>, UpdateMemberRequestStatusMutationVariables> = (props) => {
          const {requestId,data} = props ?? {};

          return  updateMemberRequestStatus(requestId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateMemberRequestStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateMemberRequestStatus>>>
    export type UpdateMemberRequestStatusMutationBody = BodyType<MemberRequestStatusUpdate>
    export type UpdateMemberRequestStatusMutationError = ErrorType<void>
    export type UpdateMemberRequestStatusMutationVariables = {requestId: number;data: BodyType<MemberRequestStatusUpdate>}

    /**
 * @summary Update a member request status
 */
export const useUpdateMemberRequestStatus = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMemberRequestStatus>>, TError,UpdateMemberRequestStatusMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateMemberRequestStatus>>,
        TError,
        UpdateMemberRequestStatusMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateMemberRequestStatusMutationOptions(options));
    }

export const getDeleteManagedMemberRequestUrl = (requestId: number,) => {




  return `/api/requests/${requestId}`
}

/**
 * @summary Delete a member request as an administrator
 */
export const deleteManagedMemberRequest = async (requestId: number, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getDeleteManagedMemberRequestUrl(requestId),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getDeleteManagedMemberRequestMutationKey = () => ['deleteManagedMemberRequest'] as const;

export const getDeleteManagedMemberRequestMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteManagedMemberRequest>>, TError,DeleteManagedMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteManagedMemberRequest>>, TError,DeleteManagedMemberRequestMutationVariables, TContext> => {

const mutationKey = getDeleteManagedMemberRequestMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteManagedMemberRequest>>, DeleteManagedMemberRequestMutationVariables> = (props) => {
          const {requestId} = props ?? {};

          return  deleteManagedMemberRequest(requestId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteManagedMemberRequestMutationResult = NonNullable<Awaited<ReturnType<typeof deleteManagedMemberRequest>>>

    export type DeleteManagedMemberRequestMutationError = ErrorType<void>
    export type DeleteManagedMemberRequestMutationVariables = {requestId: number}

    /**
 * @summary Delete a member request as an administrator
 */
export const useDeleteManagedMemberRequest = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteManagedMemberRequest>>, TError,DeleteManagedMemberRequestMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof deleteManagedMemberRequest>>,
        TError,
        DeleteManagedMemberRequestMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteManagedMemberRequestMutationOptions(options));
    }

export const getListUsersUrl = () => {




  return `/api/users`
}

/**
 * @summary List registered users
 */
export const listUsers = async ( options?: Parameters<typeof customFetch>[1]): Promise<AppUser[]> => {

  return customFetch<AppUser[]>(getListUsersUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListUsersQueryKey = () => {
    return [
    `/api/users`
    ] as const;
    }


export const getListUsersQueryOptions = <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListUsersQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listUsers>>> = ({ signal }) => listUsers({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & { queryKey: QueryKey }
}

export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>
export type ListUsersQueryError = ErrorType<void>


/**
 * @summary List registered users
 */

export function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListUsersQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetCurrentUserUrl = () => {




  return `/api/session/me`
}

/**
 * @summary Get the current application user
 */
export const getCurrentUser = async ( options?: Parameters<typeof customFetch>[1]): Promise<AppUser> => {

  return customFetch<AppUser>(getGetCurrentUserUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetCurrentUserQueryKey = () => {
    return [
    `/api/session/me`
    ] as const;
    }


export const getGetCurrentUserQueryOptions = <TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<void>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetCurrentUserQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getCurrentUser>>> = ({ signal }) => getCurrentUser({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData> & { queryKey: QueryKey }
}

export type GetCurrentUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
export type GetCurrentUserQueryError = ErrorType<void>


/**
 * @summary Get the current application user
 */

export function useGetCurrentUser<TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<void>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getGetCurrentUserQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateUserRoleUrl = (userId: string,) => {




  return `/api/users/${userId}/role`
}

/**
 * @summary Change a user's role
 */
export const updateUserRole = async (userId: string,
    roleUpdate: RoleUpdate, options?: Parameters<typeof customFetch>[1]): Promise<AppUser> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return customFetch<AppUser>(getUpdateUserRoleUrl(userId),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(roleUpdate)
  }
);}





export const getUpdateUserRoleMutationKey = () => ['updateUserRole'] as const;

export const getUpdateUserRoleMutationOptions = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateUserRole>>, TError,UpdateUserRoleMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateUserRole>>, TError,UpdateUserRoleMutationVariables, TContext> => {

const mutationKey = getUpdateUserRoleMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateUserRole>>, UpdateUserRoleMutationVariables> = (props) => {
          const {userId,data} = props ?? {};

          return  updateUserRole(userId,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateUserRoleMutationResult = NonNullable<Awaited<ReturnType<typeof updateUserRole>>>
    export type UpdateUserRoleMutationBody = BodyType<RoleUpdate>
    export type UpdateUserRoleMutationError = ErrorType<void>
    export type UpdateUserRoleMutationVariables = {userId: string;data: BodyType<RoleUpdate>}

    /**
 * @summary Change a user's role
 */
export const useUpdateUserRole = <TError = ErrorType<void>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateUserRole>>, TError,UpdateUserRoleMutationVariables, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateUserRole>>,
        TError,
        UpdateUserRoleMutationVariables,
        TContext
      > => {
      return useMutation(getUpdateUserRoleMutationOptions(options));
    }

