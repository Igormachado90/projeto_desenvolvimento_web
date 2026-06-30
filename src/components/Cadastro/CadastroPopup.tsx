import React from 'react';
import { UserForm } from '../Usuarios/UserForm';
import { useAuth } from '../../lib/useAuth';

interface CadastroPopupProps {
    onClose: () => void;
    onSuccess?: () => void;
    editingUser?: any | null;
}

export const CadastroPopup: React.FC<CadastroPopupProps> = ({
    onClose,
    onSuccess,
    editingUser
}) => {
    const { user: currentUser } = useAuth();

    return (
        <UserForm
            onClose={onClose}
            onSuccess={onSuccess}
            editingUser={editingUser}
            currentUser={currentUser}
            showSchoolField
            showPlanField
        />
    );
};

export default CadastroPopup;