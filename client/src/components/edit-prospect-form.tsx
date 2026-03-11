import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProspectSchema, STATUSES, INTEREST_LEVELS } from "@shared/schema";
import type { InsertProspect, Prospect } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface EditProspectFormProps {
  prospect: Prospect;
  onSuccess?: () => void;
}

export function EditProspectForm({ prospect, onSuccess }: EditProspectFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertProspect>({
    resolver: zodResolver(insertProspectSchema),
    defaultValues: {
      companyName: prospect.companyName,
      roleTitle: prospect.roleTitle,
      jobUrl: prospect.jobUrl ?? "",
      status: prospect.status as InsertProspect["status"],
      interestLevel: prospect.interestLevel as InsertProspect["interestLevel"],
      notes: prospect.notes ?? "",
      salary: prospect.salary ?? undefined,
      hiringManagerEmail: prospect.hiringManagerEmail ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProspect) => {
      await apiRequest("PATCH", `/api/prospects/${prospect.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Prospect updated" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update prospect", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Company Name</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" placeholder="e.g. Google" {...field} data-testid="input-edit-company-name" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Role Title</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" placeholder="e.g. Product Manager" {...field} data-testid="input-edit-role-title" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} data-testid={`option-edit-status-${s}`}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interestLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Interest Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-edit-interest">
                      <SelectValue placeholder="Select interest" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INTEREST_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} data-testid={`option-edit-interest-${level}`}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="jobUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Job URL (optional)</FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="https://..."
                    {...field}
                    value={field.value ?? ""}
                    data-testid="input-edit-job-url"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Annual Salary USD (optional)</FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    placeholder="e.g. 120000"
                    data-testid="input-edit-salary"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : Number(val));
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="hiringManagerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Hiring Manager Email (optional)</FormLabel>
              <FormControl>
                <Input
                  className="h-8 text-sm"
                  type="email"
                  placeholder="e.g. recruiter@company.com"
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-edit-hiring-manager-email"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes..."
                  className="resize-none text-sm"
                  rows={2}
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-edit-notes"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-8 text-sm" disabled={mutation.isPending} data-testid="button-save-prospect">
          {mutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
}
