export interface PromptProps {
	content: string;
}

const Prompt = (props: PromptProps) => {
	return <div>{props.content}</div>;
};

export default Prompt;


