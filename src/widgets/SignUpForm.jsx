// components
import PasswordInput from '@components/PasswordInput';
import Spring from '@components/Spring';
import {Fragment} from 'react';
import {toast} from 'react-toastify';

// hooks
import {useForm, Controller} from 'react-hook-form';

// utils
import classNames from 'classnames';

const SignUpForm = ({standalone = true}) => {
    const {register, handleSubmit, formState: {errors}, control, watch} = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            passwordConfirm: ''
        }
    });

    const Wrapper = standalone ? Fragment : Spring;
    const wrapperProps = standalone ? {} : {className: 'card card-padded'};

    const onSubmit = (data) => {
        toast.success(`Account created! Please check your email ${data.email} to confirm your account.`)
    }

    return (
        <Wrapper {...wrapperProps}>
            <div className="d-flex flex-column g-4">
                <h3>Create new account</h3>
                <p className="text-12">Fill out the form below to create a new account</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="d-flex flex-column g-20" style={{margin: '20px 0 30px'}}>
                    <input className={classNames('field', {'field--error': errors.firstName})}
                           type="text"
                           placeholder="First name"
                           {...register('firstName', {required: true})}/>
                    <input className={classNames('field', {'field--error': errors.lastName})}
                           type="text"
                           placeholder="Last name"
                           {...register('lastName', {required: true})}/>
                    <input className={classNames('field', {'field--error': errors.email})}
                           type="text"
                           placeholder="E-mail"
                           {...register('email', {required: true, pattern: /^\S+@\S+$/i})}/>
                    <Controller control={control}
                                name="password"
                                rules={{required: true}}
                                render={({field: {ref, onChange, value}, fieldState: {error}}) => (
                                    <PasswordInput
                                        className={classNames('field', {'field--error': error})}
                                        value={value}
                                        onChange={e => onChange(e.target.value)}
                                        placeholder="Password"
                                        innerRef={ref}/>
                                )}
                    />
                    <Controller control={control}
                                name="passwordConfirm"
                                rules={{
                                    required: true,
                                    validate: value => value === watch('password')
                                }}
                                render={({field: {ref, onChange, value}, fieldState: {error}}) => (
                                    <PasswordInput
                                        className={classNames('field', {'field--error': error})}
                                        value={value}
                                        onChange={e => onChange(e.target.value)}
                                        placeholder="Confirm password"
                                        innerRef={ref}/>
                                )}
                    />
                </div>
                <button type="submit" className="btn btn--sm">Create account</button>
            </form>
        </Wrapper>
    )
}

export default SignUpForm