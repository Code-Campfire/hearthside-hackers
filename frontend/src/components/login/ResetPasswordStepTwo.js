import React, {useState} from "react";
import { Formik, Form, Field } from "formik";
// import { LDInput } from "../../controls/inputs/LDInput";
// import { Spinner } from "../../controls/features/Spinner";
// import { Button } from "@material-ui/core";
// import { makeStyles } from '@material-ui/core/styles';
// import { handleError } from "../../../util/handleError";
// import { useTranslation } from "react-i18next";
// import authClient from "../../../api/authClient";

const useStyles = makeStyles(theme => ({
    button: {
      margin: theme.spacing(1),
      width: "45% !important",
      marginLeft: "25% !important",
      color: "#fff"
    }
  }));

export const ResetPasswordStepTwo = ({ signInValues, props, handleFieldChange, displayErrorMessage, closeErrorMessage }) => {
    const classes = useStyles();
    const [isLoading, setIsLoading ] = useState(false);
    const [codeResent, setCodeResent] = useState(false);
    const { t, i18n } = useTranslation();

    const resendConfirmationCode = () => {
        setCodeResent(true);
        authClient.resendConfirmationCode({email: signInValues.email})
            .then(resp => setIsLoading(false))
            .catch(err => handleError(err, displayErrorMessage, setIsLoading))
            .finally(() => setCodeResent(false));
    }

    const resetPassword = () => {
        closeErrorMessage();

        if (signInValues.code.length === 0 || parseInt(signInValues.code) === NaN) {
            displayErrorMessage("Invalid code provided.");
            return;
        }

        setIsLoading(true);

        var payload = {
            email: signInValues.email,
            code: signInValues.code,
            newPassword: signInValues.passwordConfirmation
        };
        authClient.resetPassword(payload)
            .then(() => {
                setIsLoading(false);

                var userRoute = null;
                switch(signInValues.userType) {
                    case 1:
                        userRoute = 'jobseeker'
                        break;
                    case 2:
                        userRoute = 'contractor'
                        break;
                    case 3:
                        userRoute = 'union'
                        break;
                    default:
                        break;
                }

                if (userRoute !== null) 
                    props.history.push(`/login/${userRoute}`) 
                else 
                    props.history.push("/");
            }).catch(err => handleError(err, props.displayErrorMessage, setIsLoading));  
    }

    return (
        <Formik
            initialValues={signInValues}
            //validationSchema={LoginSchema}
            onSubmit={() => resetPassword()}
        >
        {({ errors, touched }) => (
          <Form className="password-reset--form d-flex flex flex-column">
            <h1 className="confirmation-code--header" >
                {t("ResetStepTwo.Confirmation","Confirmation Code")}
            </h1>
            <h6 className="confirmation-code--subheader">
                {t("ResetStepTwo.Emailed","We've emailed a confirmation code to")} <strong className="confirmation-code-target-email">{signInValues.email}</strong>. {t("ResetStepTwo.EmailedTwo","Please enter the code to confirm your identity")}.
            </h6>

            <LDInput    
                name="code"
                label={t("ResetStepTwo.ConfirmationCode","Confirmation Code")}
                onChange={evt => handleFieldChange(evt)}
                errors={errors}
                touched={touched}
            />


            {isLoading ? (
                <div style={{ marginTop: 13 }}>
                    <Spinner />
                </div>
            ) : (
                <div className="reset-pass-button-container">
                    <button 
                        // disabled={isDisabled}
                        style={{ width: '100%', height: 50, fontSize: 17 }}
                        type="submit" 
                        className="btn btn-secondary login--btn"
                    >
                        {t("ResetStepTwo.Submit","Submit")}
                    </button>
                    <Button
                        disabled={codeResent}
                        variant={"contained"}
                        className={classes.confirmButton !== undefined ? classes.button : "p-2"}
                        id="Password--Reset--Resend--Code--Button"
                        onClick={resendConfirmationCode}
                    >
                        {t("ResetStepTwo.Resend","Resend Code")}
                    </Button>
                </div>
            )}
          </Form>
        )}
      </Formik>
    );
}