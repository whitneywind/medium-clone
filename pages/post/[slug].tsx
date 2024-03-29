import { sanityClient, urlFor } from "../../sanity";
import Header from "../../components/Header";
import { Post } from "../../typings";
import { GetStaticPaths, GetStaticProps } from "next";
import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from 'react';


interface IFormInput {
    _id: string;
    name: string;
    email: string;
    comment: string;
}

interface Props {
    post: Post;
}

function Post({ post }: Props) {
    const [submitted, setSubmitted] = useState(false);

    console.log(post);

    const { 
        register, 
        handleSubmit, 
        formState: { errors } 
    } = useForm<IFormInput>();

    const onSubmit: SubmitHandler<IFormInput> = (data) => {
        fetch("/api/createComment", {
            method: "POST",
            body: JSON.stringify(data),
        })
        .then(() => {
            console.log(data);
            setSubmitted(true);
        }).catch((err) => {
            console.log(err)
            setSubmitted(false);
        });
    } ;

  return (
    <main>
        <Header />

            <img className="w-full h-40 object-cover" src={urlFor(post.mainImage).url()!} alt="alt text" />

            <article className="max-w-3xl mx-auto p-5">
                <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
                <h2 className="text-xl font-light text-gray-500 mb-2">{post.description}</h2>

                <div className="flex items-center space-x-2">
                    <img className="h-10 w-10 rounded-full" src={urlFor(post.author.image).url()!} />
                    <p className="font-extralight text-sm">
                        Blog post by <span className="text-green-600">{post.author.name}</span> - Published at {new Date(post._createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="mt-10">
                    <PortableText
                        dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
                        projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
                        content={post.body}
                        serializers={{
                            h1: (props: any) => (
                                <h1 className="text-2xl font-bold my-5" {...props} />
                            ),
                            h2: (props: any) => (
                                <h2 className="text-xl font-bold my-5" {...props} />
                            ),
                            li: ({ children }: any) => (
                                <li className="ml-4 list-disc">{children}</li>
                            ),
                            link: ({ href, children }: any) => (
                                <a href={href} className="text-blue-500 hover:underline">
                                    {children}
                                </a>
                            ),
                        }}                />
                </div>
            </article>

            <hr className="max-w-lg my-5 mx-auto border border-green-500" />

            {submitted ? (
                <div className="flex flex-col p-10 bg-green-500 text-white max-w-2xl mx-auto">
                    <h1 className="font-bold self-center">Thanks for submitting! Once it's been approved, it will appear below. </h1>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col p-5 max-w-2xl mb-10 mx-auto">
                    <h3 className="text-sm text-green-400">Enjoyed the article?</h3>
                    <h4 className="text-3xl font-bold">Leave a Comment</h4>
                    <hr className="py-3 mt-2" />

                    <input 
                        {...register("_id")}
                        type="hidden"
                        name="_id"
                        value={post._id}
                    />

                    <label className="block mb-5">
                        <span className="text-gray-700">Name</span>
                        <input className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-green-500 outline-none focus:ring" placeholder="john applesauce" type="text" {...register("name", { required: true })} />
                    </label>
                    <label className="block mb-5">
                        <span className="text-gray-700">Email</span>
                        <input className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-green-500 outline-none focus:ring" placeholder="john orangejuice" type="text" {...register("email", { required: true })} />
                    </label>
                    <label className="block mb-5">
                        <span className="text-gray-700">Comment</span>
                        <textarea className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-green-500 outline-none focus:ring" placeholder="john applesauce" rows={8} {...register("comment", { required: true })} />
                    </label>

                    {/* errors will return when field validation fails */}
                    <div className="flex flex-col p-5">
                        {errors.name && (
                            <span className="text-red-500">The name field is required</span>
                        )}
                        {errors.email && (
                            <span className="text-red-500">The email field is required</span>
                        )}
                        {errors.comment && (
                            <span className="text-red-500">The comment field is required</span>
                        )}
                    </div>

                    <input type="submit" className="shadow bg-green-500 hover:bg-green-400 hover:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer" />


                </form>
            )}

       {/* comments */}
        <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-green-500 shadow space-y-2">
            <h3 className="text-4xl">Comments</h3>
            <hr className="pb-2" />
            {post.comments.map((comment) => (
                <div key={comment._id}>
                    <p>
                        <span className="text-green-500">{comment.name}:</span>{comment.comment}
                        </p>
                </div>
            ))}
        </div>
    </main>
  );
}

export default Post;


export const getStaticPaths: GetStaticPaths = async () => {
    const query = `
        *[_type == "post"]{
            _id,
            slug {
                current
            }
        }
    `

    const posts = await sanityClient.fetch(query);

    const paths = posts.map((post: Post) => ({
        params: {
            slug: post.slug.current
        }
    }))

    return {
        paths,
        fallback: 'blocking'
    }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const query = `
        *[_type == "post" && slug.current == $slug][0]{
            _id,
            _createdAt,
            title,
            author-> {
              name,
              image
            },
            'comments': *[
                _type == "comment" &&
                post._ref == ^._id &&
                approved == true],
            description,
            mainImage,
            slug,
            body
        }`;
    
    const post = await sanityClient.fetch(query, {
        slug: params?.slug,
    });

    if (!post) {
        return {
            notFound: true
        }
    }

    return {
        props: {
            post,
        }
       // revalidate: 60, // after 60 seconds, update old cached version
    }
}