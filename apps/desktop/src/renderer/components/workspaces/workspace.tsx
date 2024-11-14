import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { Layout } from '@/renderer/components/layouts/layout';

export const Workspace = () => {
  const { userId, nodeId } = useParams<{ userId: string; nodeId?: string }>();

  const account = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspace = account.workspaces.find((w) => w.userId === userId);

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        navigateToNode(nodeId) {
          navigate(`/${userId}/${nodeId}`);
          if (nodeId === modal) {
            setSearchParams((prev) => {
              prev.delete('modal');
              return prev;
            });
          }
        },
        isNodeActive(id) {
          return id === nodeId;
        },
        openModal(modal) {
          setSearchParams((prev) => {
            return {
              ...prev,
              modal: modal,
            };
          });
        },
        closeModal() {
          setSearchParams((prev) => {
            prev.delete('modal');
            return prev;
          });
        },
        markAsSeen() {
          // window.colanode.executeMutation({
          //   type: 'mark_node_as_seen',
          //   nodeId: nodeId,
          //   versionId: versionId,
          //   userId: workspace.userId,
          // });
        },
      }}
    >
      <Layout nodeId={nodeId} modal={modal} />
    </WorkspaceContext.Provider>
  );
};
