import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import {
    Form,
    Labeled,
    TextField,
    TextInput,
    useGetIdentity,
    useGetOne,
    useNotify,
    useUpdate,
} from 'react-admin';
import { useFormState } from 'react-hook-form';
import { USER_STORAGE_KEY } from '../authProvider';
import { UpdatePassword } from './UpdatePassword';
import ImageEditorField from '../misc/ImageEditorField';

export const SettingsPage = () => {
    const [update] = useUpdate();
    const [isEditMode, setEditMode] = useState(false);
    const { identity, refetch } = useGetIdentity();
    const user = useGetOne('sales', { id: identity?.id });
    const notify = useNotify();

    if (!identity) return null;

    const handleOnSubmit = async (values: any) => {
        await update(
            'sales',
            {
                id: identity.id,
                data: values,
                previousData: identity,
            },
            {
                onSuccess: data => {
                    // Update local user
                    localStorage.setItem(
                        USER_STORAGE_KEY,
                        JSON.stringify(data)
                    );
                    refetch();
                    setEditMode(false);
                    notify('Your profile has been updated');
                },
                onError: _ => {
                    notify('An error occurred. Please try again', {
                        type: 'error',
                    });
                },
            }
        );
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Form onSubmit={handleOnSubmit} record={user.data}>
                <SettingsForm
                    isEditMode={isEditMode}
                    setEditMode={setEditMode}
                />
            </Form>
        </Container>
    );
};

const SettingsForm = ({
    isEditMode,
    setEditMode,
}: {
    isEditMode: boolean;
    setEditMode: (value: boolean) => void;
}) => {
    const [update] = useUpdate();
    const notify = useNotify();
    const { identity, refetch } = useGetIdentity();
    const { isDirty } = useFormState();
    const [openPasswordChange, setOpenPasswordChange] = useState(false);

    if (!identity) return null;

    const handleClickOpenPasswordChange = () => {
        setOpenPasswordChange(true);
    };

    const handleAvatarUpdate = async (values: any) => {
        await update(
            'sales',
            {
                id: identity.id,
                data: values,
                previousData: identity,
            },
            {
                onSuccess: data => {
                    // Update local user
                    localStorage.setItem(
                        USER_STORAGE_KEY,
                        JSON.stringify(data)
                    );
                    refetch();
                    setEditMode(false);
                    notify('Your profile has been updated');
                },
                onError: _ => {
                    notify('An error occurred. Please try again', {
                        type: 'error',
                    });
                },
            }
        );
    };

    return (
        <Card>
            <CardContent>
                <Stack mb={2} direction="row" justifyContent="space-between">
                    <Typography variant="h5" color="textSecondary">
                        My info
                    </Typography>
                </Stack>
                <Stack gap={2} mb={2}>
                    <ImageEditorField
                        source="avatar"
                        type="avatar"
                        onSave={handleAvatarUpdate}
                        linkPosition="right"
                    />
                    <TextRender source="first_name" isEditMode={isEditMode} />
                    <TextRender source="last_name" isEditMode={isEditMode} />
                    <TextRender source="email" isEditMode={isEditMode} />
                </Stack>
                {!isEditMode && (
                    <>
                        <Button
                            variant="outlined"
                            onClick={handleClickOpenPasswordChange}
                        >
                            Change password
                        </Button>
                        <UpdatePassword
                            open={openPasswordChange}
                            setOpen={setOpenPasswordChange}
                        />
                    </>
                )}
            </CardContent>

            <CardActions
                sx={{
                    paddingX: 2,
                    background: theme => theme.palette.background.default,
                    justifyContent: isEditMode ? 'space-between' : 'flex-end',
                }}
            >
                {isEditMode && (
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!isDirty}
                        hidden={isEditMode}
                    >
                        Save
                    </Button>
                )}
                <Button
                    variant="text"
                    size="small"
                    startIcon={isEditMode ? <VisibilityIcon /> : <EditIcon />}
                    onClick={() => setEditMode(!isEditMode)}
                >
                    {isEditMode ? 'Show' : 'Edit'}
                </Button>
            </CardActions>
        </Card>
    );
};

const TextRender = ({
    source,
    isEditMode,
}: {
    source: string;
    isEditMode: boolean;
}) => {
    if (isEditMode) {
        return <TextInput source={source} helperText={false} />;
    }
    return (
        <Labeled sx={{ mb: 0 }}>
            <TextField source={source} />
        </Labeled>
    );
};

SettingsPage.path = '/settings';
