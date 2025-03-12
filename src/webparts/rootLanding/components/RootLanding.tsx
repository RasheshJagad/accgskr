import * as React from 'react';
import styles from './RootLanding.module.scss';
import type { IRootLandingProps } from './IRootLandingProps';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { TooltipDelay, TooltipHost } from '@fluentui/react';
require('../../../../node_modules/bootstrap/dist/css/bootstrap.min.css');

const CustomPrevArrow = (prop: any): any => {
  const { onClick } = prop;
  return (
    <span className={`${styles.slickArrow} ${styles.slickPrev}`} onClick={onClick}>Prev</span>
  )
};

const CustomNextArrow = (prop: any): any => {
  const { onClick } = prop;
  return (
    <span className={`${styles.slickArrow} ${styles.slickNext}`} onClick={onClick}>Next</span>
  )
};

const CustomPrevArrow2 = (prop: any): any => {
  const { onClick } = prop;
  return (
    <span className={`${styles.slickArrow2} ${styles.slickPrev2}`} onClick={onClick}>Prev</span>
  )
};

const CustomNextArrow2 = (prop: any): any => {
  const { onClick } = prop;
  return (
    <span className={`${styles.slickArrow2} ${styles.slickNext2}`} onClick={onClick}>Next</span>
  )
};

const RootLanding: React.FunctionComponent<IRootLandingProps> = (props: IRootLandingProps) => {
  const [cauroselItems, setCauroselItems] = React.useState<any[]>([]);
  const [cauroselKPIs, setCauroselKPIs] = React.useState<any[]>([]);
  const [cauroselCatagories, setCauroselCatagories] = React.useState<any[]>([]);

  const settings1 = {
    dots: false,
    infinite: true,
    speed: 800,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings:
        {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 700,
        settings:
        {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 465,
        settings:
        {
          slidesToShow: 1,
        }
      }
    ]
  };
  const settings2 = {
    dots: false,
    arrows: true,
    nextArrow: <CustomNextArrow2 />,
    prevArrow: <CustomPrevArrow2 />,
    infinite: true,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    fade: true
  };

  const loadCarousel = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const cItems = await sp.web.lists.getByTitle('Services').items();
    setCauroselItems(cItems);
  }
  const loadCarouselKPIs = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const cItems = await sp.web.lists.getByTitle('KPIs').items();
    setCauroselKPIs(cItems);
  }

  React.useEffect(() => {
    loadCarousel().then(_ => { }).catch(_ => { });
    loadCarouselKPIs().then(_ => { }).catch(_ => { });
  }, []);
  React.useEffect(() => {
    setCauroselCatagories(cauroselKPIs.map(item => item.KPICategory).filter((value, index, self) => self.indexOf(value) === index));
  }, [cauroselKPIs]);

  const redirectTo = (url: string): void => {
    window.location.href = url
  }

  return (
    <>
      <div>
        <div className={`${styles.banner}`}>
          <div className={`${styles.bannerImage}`} />
          <div className={`${styles.bannerText}`}>
            <h1>{props.title}</h1>
            <TooltipHost
              content={props.description}
              delay={TooltipDelay.zero}
            >
              <span>{props.description}</span>
            </TooltipHost>
          </div>
        </div>
      </div>
      <div className={styles.homeServiceSec}>
        <div className={styles.homeServiceSecHeading}>
          <h2>{props.servicesTitle}</h2>
          <span>{props.servicesDescription}</span>
        </div>
        <div className={styles.servicesCarouselContainer}>
          <Slider {...settings1}>
            {
              cauroselItems.map((_: any, index: number) => {
                return (
                  <div key={index} className={`${styles.servicesCarouselItem}`} onClick={() => { redirectTo(_.ServiceURL.Url) }}>
                    <figure>
                      <img src={`${_.ServiceImage.Url}`} alt={`${_.Title}`} />
                      <figcaption className={`${styles.figcaption}`}>
                        <strong>{_.Title}</strong>
                        {/* <span>{_.ServiceDescription}</span> */}
                      </figcaption>
                    </figure>
                  </div>
                );
              })
            }
          </Slider>
        </div>
      </div>
      <div className={styles.center}>
        <Slider {...settings2}>
          {
            cauroselCatagories.map((c: string, index: number) => {
              return (
                <article key={index} className={`${styles.carouselItemHolder}`}>
                  <div className={`${styles.carouselItem}`}>
                    <strong>{c}</strong>
                    <ul>
                      {
                        cauroselKPIs.filter(k => k.KPICategory === c).map((_: any, index: number) => {
                          return (<li key={index}><strong>{_.KPIValue}</strong><span>{_.Title}</span></li>);
                        })
                      }
                    </ul>
                  </div>
                </article>
              );
            })
          }
        </Slider>
      </div>
    </>
  );
}
export default RootLanding;