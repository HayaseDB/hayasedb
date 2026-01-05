import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  pixelBasedPreset,
  Preview,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AccountDeletionEmailProps {
  appName?: string;
  userName: string;
  deletionDate: string;
}

export const AccountDeletionEmail = ({
  appName = 'HayaseDB',
  userName = 'John Doe',
  deletionDate = new Date().toLocaleDateString(),
}: AccountDeletionEmailProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>Your {appName} account has been deleted</Preview>
          <Container className="mx-auto my-[40px] max-w-[560px] p-[20px]">
            <Heading className="mx-0 my-[16px] p-0 text-[24px] font-semibold text-black">
              Account Deleted
            </Heading>

            <Text className="text-[15px] text-black leading-[24px]">
              Hi {userName},
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              This email confirms that your {appName} account was deleted on{' '}
              {deletionDate}.
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              All your sessions have been terminated and you will no longer be
              able to access your account.
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              If you did not request this deletion, please contact our support
              team immediately.
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              Best regards,
              <br />
              The {appName} Team
            </Text>

            <Hr className="mx-0 my-[32px] w-full border border-[#e5e5e5] border-solid" />

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              This is an automated message. Please do not reply to this email.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              © {currentYear} {appName}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AccountDeletionEmail;
