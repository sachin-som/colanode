import React from 'react';
import { FieldDataType } from '@/types/databases';
import {
  SquareCheck,
  User,
  Calendar,
  Mail,
  File,
  ListChecks,
  Hash,
  Smartphone,
  ListCheck,
  Text,
  Link,
  X,
  ShieldQuestion,
} from 'lucide-react';

interface FieldIconProps {
  type?: FieldDataType;
  className?: string;
}

export const FieldIcon = ({ type, className }: FieldIconProps) => {
  switch (type) {
    case 'boolean':
      return <SquareCheck className={className} />;
    case 'collaborator':
      return <User className={className} />;
    case 'created_at':
      return <Calendar className={className} />;
    case 'created_by':
      return <User className={className} />;
    case 'date':
      return <Calendar className={className} />;
    case 'email':
      return <Mail className={className} />;
    case 'file':
      return <File className={className} />;
    case 'multi_select':
      return <ListChecks className={className} />;
    case 'number':
      return <Hash className={className} />;
    case 'phone':
      return <Smartphone className={className} />;
    case 'select':
      return <ListCheck className={className} />;
    case 'text':
      return <Text className={className} />;
    case 'url':
      return <Link className={className} />;
    default:
      return <ShieldQuestion className={className} />;
  }
};
