import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProspectSchema, STATUSES, INTEREST_LEVELS } from "@shared/schema";
import type { InsertProspect } from "@shared/schema";
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

export function AddProspectForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();

  const form = useForm<InsertProspect>({
    resolver: zodResolver(insertProspectSchema),
    defaultValues: {
      companyName: "",
      roleTitle: "",
      jobUrl: "",
      status: "Bookmarked",
      interestLevel: "Medium",
      notes: "",
      salary: undefined,
      hiringManagerEmail: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProspect) => {
      await apiRequest("POST", "/api/prospects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      form.reset();
      toast({ title: "Prospect added successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to add prospect", variant: "destructive" });
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
                  <Input className="h-8 text-sm" placeholder="e.g. Google" {...field} data-testid="input-company-name" />
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
                  <Input className="h-8 text-sm" placeholder="e.g. Product Manager" {...field} data-testid="input-role-title" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} data-testid={`option-status-${s}`}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-interest">
                      <SelectValue placeholder="Select interest" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INTEREST_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} data-testid={`option-interest-${level}`}>
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
                    data-testid="input-job-url"
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
                    data-testid="input-salary"
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
                  data-testid="input-hiring-manager-email"
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
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-8 text-sm" disabled={mutation.isPending} data-testid="button-submit-prospect">
          {mutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Prospect"
          )}
        </Button>
      </form>
    </Form>
  );
}
