import Link from "next/link";
import { Animal } from "@/types"
import styles from './styles.module.css'

export default function Card({props}:{props:Animal}){
    
    const{name,gender,lifeSatge,status,images,id}=props;
    const img= images[0];
    const {imgUrl,imgAlt}= img;

    return( 
        <article className={styles.card}>
            <div>
            <img className={styles.img} src={imgUrl} alt={imgAlt} />
            </div>
            <div className={styles.dataContainer}>
            <h3 className={styles.name}>{name}</h3> 
            <p className={styles.p}>{`${gender} | ${lifeSatge} | ${status}`}</p>
            <Link className={styles.button} href={`/info/${id}`}>Ver más info</Link>        
            </div>

        </article>
    )
}