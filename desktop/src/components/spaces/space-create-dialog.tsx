import React from "react";
import {useWorkspace} from "@/contexts/workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/spinner";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Node} from "@/types/nodes";
import {generateId, IdType} from "@/lib/id";
import {createNode} from "@/lib/nodes";

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

export function SpaceCreateDialog({
 open,
 onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}){
  const workspace = useWorkspace();
  const [isPending, setIsPending] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  function handleCancel(){
    form.reset();
    onOpenChange(false);
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);

    const node: Node = {
      id: generateId(IdType.Space),
      type: 'space',
      attrs: {
        name: values.name,
        description: values.description,
      },
      workspaceId: workspace.id,
      createdAt: new Date(),
      createdBy: workspace.userNodeId,
      versionId: generateId(IdType.Version)
    }

    await createNode(workspace.accountId, node);
    setIsPending(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create space</DialogTitle>
          <DialogDescription>
            Create a new space to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a short description about the workspace"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}