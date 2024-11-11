export type NodeCollaboratorsWrapper = {
  direct: NodeCollaborator[];
  inherit: InheritNodeCollaboratorsGroup[];
};

export type InheritNodeCollaboratorsGroup = {
  id: string;
  name: string;
  avatar: string | null;
  collaborators: NodeCollaborator[];
};

export type NodeCollaborator = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
};
