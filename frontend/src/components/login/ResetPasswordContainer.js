import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ResetPasswordStepOne } from "./ResetPasswordStepOne";
import { ResetPasswordStepTwo } from "./ResetPasswordStepTwo";
import queryString from 'query-string';
import "./styles/resetPassword.css";

export const ResetPasswordContainer = props => {
    const [step, setStep] = useState(1);

    const [signInValues, setSignInValues] = useState({
        email: "",
        password: "",
        passwordConfirmation: "",
        code: "",
        userType: null
    });

    const { search } = useLocation(); // extracts query params from URL via react-router
    const [queryParams, setQueryParams] = useState();

    const nextStep = () => setStep(2);

    const handleFieldChange = (evt) => {
        const stateToChange = {...signInValues};
        stateToChange[evt.target.name] = evt.target.value.trim();
        setSignInValues(stateToChange);
    }

    const setUserType = () => {
        if (signInValues.userType === null) {
            const stateToChange = {...signInValues};
            stateToChange.userType = parseInt(queryParams.ut);
            setSignInValues(stateToChange);
        }
    }

    useEffect(() => {   
        if (queryParams === undefined) {
            setQueryParams(queryString.parse(search))
            return;
        }
        setUserType();
    }, [queryParams, signInValues, step])

    switch (step) {
        case 1:
            return (
                <ResetPasswordStepOne 
                    signInValues={signInValues}
                    setSignInValues={setSignInValues}
                    nextStep={nextStep}
                    displayErrorMessage={props.displayErrorMessage}
                    closeErrorMessage={props.closeErrorMessage}
                    openConfirmationModal={props.openConfirmationModal}
                    closeConfirmationModal={props.closeConfirmationModal}
                    handleFieldChange={handleFieldChange}
                />
            )
        case 2:
            return (
                <ResetPasswordStepTwo 
                    signInValues={signInValues}
                    setSignInValues={setSignInValues}
                    handleFieldChange={handleFieldChange}
                    displayErrorMessage={props.displayErrorMessage}
                    closeErrorMessage={props.closeErrorMessage}
                    props={props}
                />
            )
        default:
    };
}