
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { ProblemsTable } from "@/components/ProblemsTable";
import { useProblems, type GetProblemsParams } from "@/lib/api/problems";

export const Route = createFileRoute("/problems/")({
  component: ProblemsPage,
});

function ProblemsPage() {
  const [params, setParams] = useState<GetProblemsParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    order: "desc",
  });

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(params.search, 300);

  const { data, isLoading, isError, error, refetch } = useProblems({
    ...params,
    search: debouncedSearch,
  });

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    setParams((prev) => ({ ...prev, page: 1 }));
  }, [params.search, params.difficulty, params.tags, params.sortBy, params.order]);

  return (
    <ProblemsTable
      data={data?.data || []}
      pagination={
        data?.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: 0,
          totalPages: 0,
        }
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      params={params}
      onParamsChange={setParams}
      onRefresh={refetch}
    />
  );
}