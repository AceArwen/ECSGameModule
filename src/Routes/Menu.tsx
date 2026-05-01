import { useNavigate } from "react-router-dom";
import Button from '../components/Button';

export default function Menu() {
    const navigate = useNavigate();
    return (
        <div>
            <h1>Menu</h1>
            <Button onClick={() => navigate("/gamescreen")}>Play Game</Button>
        </div>
    );
}