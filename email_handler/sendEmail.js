import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.ReSend_APIKEY) {
    console.log("Provide ReSend API key inside the .env file");
}

const resend = new Resend(process.env.ReSend_APIKEY);

const sendemail = async ({ sendTo, Subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'nexamart <onboarding@resend.dev>',
            to: sendTo,
            subject: Subject,
            html: html,
        });

        if (error) {
            console.log(error);
        }

        return data;
    } catch (error) {
        console.log(error);
    }
};
export default sendemail;