interface Props {
    children: React.ReactNode;
}

const Layout = ({children}: Props) => {


    return (
    <div className="h-screen bg-gray-800">
        {children}
    </div>
    )
}

export default Layout