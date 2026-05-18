"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormInput } from "@/lib/schemas/common";
import { useSubmitContactForm } from "@/hooks/queries/use-support";

const ASSET = "/media/cinect-contact";
const FACEBOOK_URL = "https://www.facebook.com/cinestarcinemasvietnam";
const ZALO_URL = "https://zalo.me/2861828859391058401";
const EMAIL = "cskh@cinect.com.vn";
const PHONE = "1900 0085";
const PHONE_HREF = "tel:19000085";
const ADDRESS = "135 Hai Bà Trưng, phường Sài Gòn, TP.HCM";
const MAPS_URL = "https://maps.app.goo.gl/RYfzjhyyw7vn7PuV8";

export function CinectContactSection() {
  const t = useTranslations("support");
  const submitForm = useSubmitContactForm();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: t("contactDefaultSubject"),
    },
  });

  function onSubmit(data: ContactFormInput) {
    submitForm.mutate(
      {
        ...data,
        subject: data.subject?.trim() || t("contactDefaultSubject"),
      },
      {
        onSuccess: () =>
          reset({
            name: "",
            email: "",
            message: "",
            subject: t("contactDefaultSubject"),
          }),
      }
    );
  }

  return (
    <section className="cinect-contact" aria-labelledby="cinect-contact-heading">
      <div className="cinect-contact__grid">
        <div className="ct-left">
          <div className="ct-left-inner">
            <div className="sec-heading">
              <h2 id="cinect-contact-heading" className="heading">
                {t("contactHeading")}
              </h2>
            </div>
            <div className="ct-social">
              <a
                className="ct-social-link"
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Image
                  src={`${ASSET}/ct-1.webp`}
                  alt=""
                  width={180}
                  height={120}
                  className="h-auto w-full max-w-[18rem] object-contain sm:max-w-[14rem]"
                  loading="lazy"
                />
                <span className="txt">{t("contactFacebook")}</span>
              </a>
              <a
                className="ct-social-link"
                href={ZALO_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Zalo"
              >
                <Image
                  src={`${ASSET}/ct-2.webp`}
                  alt=""
                  width={180}
                  height={120}
                  className="h-auto w-full max-w-[18rem] object-contain sm:max-w-[14rem]"
                  loading="lazy"
                />
                <span className="txt">{t("contactZalo")}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="ct-right">
          <div className="ct-box">
            <h3 className="heading">{t("contactInfoHeading")}</h3>
            <ul className="ct-tt">
              <li>
                <Image src={`${ASSET}/ct-1.svg`} alt="" width={24} height={24} />
                <a href={`mailto:${EMAIL}`} aria-label="Email">
                  {EMAIL}
                </a>
              </li>
              <li>
                <Image src={`${ASSET}/ct-2.svg`} alt="" width={24} height={24} />
                <a href={PHONE_HREF} aria-label="Telephone">
                  {PHONE}
                </a>
              </li>
              <li>
                <Image src={`${ASSET}/ct-3.svg`} alt="" width={24} height={24} />
                <a href={MAPS_URL} target="_blank" rel="noreferrer" aria-label="Address">
                  {ADDRESS}
                </a>
              </li>
            </ul>

            <form className="ct-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <input type="hidden" {...register("subject")} />
              <input
                className="re-input"
                placeholder={t("contactPlaceholderName")}
                aria-label={t("name")}
                {...register("name")}
              />
              {errors.name && (
                <p className="cinect-contact__error">{errors.name.message}</p>
              )}
              <input
                className="re-input"
                type="email"
                placeholder={t("contactPlaceholderEmail")}
                aria-label={t("email")}
                {...register("email")}
              />
              {errors.email && (
                <p className="cinect-contact__error">{errors.email.message}</p>
              )}
              <textarea
                className="re-input re-input--area"
                placeholder={t("contactPlaceholderMessage")}
                aria-label={t("message")}
                rows={5}
                {...register("message")}
              />
              {errors.message && (
                <p className="cinect-contact__error">{errors.message.message}</p>
              )}
              <button type="submit" className="cs-btn cs-btn--pri" disabled={submitForm.isPending}>
                {submitForm.isPending ? t("sending") : t("contactSubmit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
