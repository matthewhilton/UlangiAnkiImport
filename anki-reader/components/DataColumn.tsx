import { FunctionComponent } from "react";

interface DataColumnProps {
    id: string,
    data: any[]
}

const DataColumn: FunctionComponent<DataColumnProps> = ({ id, data }) => {
    const copyText = () => {
        const text = document.getElementById(id) as HTMLTextAreaElement;

        if(!text) return;

        text.select();
        text.setSelectionRange(0, 99999)

        const value = text.value;
        const valueCleaned = value
                            .split("\n")
                            .map((val, i) => i == 0 ? val : val.substring(1))
                            .join("\n")
        navigator.clipboard.writeText(valueCleaned);

        alert("Text copied")
    }

    return (
        <div>
            {
                // We use a hidden textarea element to be able to copy to google sheets, copying directly from the <p> strips newlines!
            }
            <textarea style={{display: "none"}} id={id} value={data.map(item => item + "\n")}/>
            <p onClick={copyText}>{ data.map(item => <> {item} <br /> </>)} </p>
        </div>
    )
}

export default DataColumn;