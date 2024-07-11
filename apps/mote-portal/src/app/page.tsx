import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
} from '@nextui-org/react';
import Image from 'next/image';

function Head() {
    return (
        <Navbar>
            <NavbarBrand>
                <p className="font-bold text-inherit">Mote</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Features
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link href="#" aria-current="page">
                        Customers
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem className="hidden lg:flex">
                    <Link href="https://app.mote.dev">登录</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button
                        as={Link}
                        color="primary"
                        href="https://app.mote.dev/create"
                        variant="flat"
                    >
                        注册
                    </Button>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}

export default function Home() {
    return (
        <>
            <Head />
            <main className="flex flex-col items-center justify-between p-24">
                <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                    <div>
                        <h1 className="text-6xl">你的知识空间</h1>
                        <div className="pt-6">
                            <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                                笔记？表格？思维导图？网页？一网打尽
                            </p>
                        </div>
                    </div>
                    <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
                        <a
                            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
                            href="https://app.mote.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            By{' '}
                            <Image
                                src="/mote-512.png"
                                alt="Mote Logo"
                                className="dark:invert"
                                width={100}
                                height={100}
                                priority
                            />
                        </a>
                    </div>
                </div>
                <div className="pt-8">
                    <Image
                        src="/images/screenshot.png"
                        alt="screenshot"
                        className="dark:invert"
                        width={1400}
                        height={800}
                        quality={100}
                        priority
                    />
                </div>
            </main>
            <section className="bg-white flex flex-col items-center justify-between p-24">
                <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
                    <a
                        href="#"
                        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <h2 className="mb-3 text-2xl font-semibold">
                            Docs{' '}
                            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                -&gt;
                            </span>
                        </h2>
                        <p className="m-0 max-w-[30ch] text-sm opacity-50">
                            Find in-depth information about Next.js features and
                            API.
                        </p>
                    </a>

                    <a
                        href="#"
                        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <h2 className="mb-3 text-2xl font-semibold">
                            Learn{' '}
                            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                -&gt;
                            </span>
                        </h2>
                        <p className="m-0 max-w-[30ch] text-sm opacity-50">
                            Learn about Next.js in an interactive course
                            with&nbsp;quizzes!
                        </p>
                    </a>

                    <a
                        href="#"
                        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <h2 className="mb-3 text-2xl font-semibold">
                            Templates{' '}
                            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                -&gt;
                            </span>
                        </h2>
                        <p className="m-0 max-w-[30ch] text-sm opacity-50">
                            Explore starter templates for Next.js.
                        </p>
                    </a>

                    <a
                        href="#"
                        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <h2 className="mb-3 text-2xl font-semibold">
                            Deploy{' '}
                            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                -&gt;
                            </span>
                        </h2>
                        <p className="m-0 max-w-[30ch] text-balance text-sm opacity-50">
                            Instantly deploy your Next.js site to a shareable
                            URL with Vercel.
                        </p>
                    </a>
                </div>
            </section>
        </>
    );
}
