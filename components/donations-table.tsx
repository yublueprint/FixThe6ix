import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PaintBrush01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";


const DonationsTable = ({filteredData}: {filteredData: any[]}) => {

    const [selectedBoxes, setSelectedBoxes] = useState<boolean[]>([]);

    const selectAll = (value:boolean) => {
        selectedBoxes.map((item, i) => {
            selectedBoxes[i] = value;
        })

        setSelectedBoxes(selectedBoxes.slice());
    }

    const selectThisBox = (i:number) => {
        selectedBoxes[i] = !selectedBoxes[i];

        setSelectedBoxes(selectedBoxes.slice());
    }

    useEffect(() => {
        return setSelectedBoxes(Array(filteredData.length).fill(false));
    }, [filteredData]);

    return (
        <div className="overflow-x-auto">
        <Table>
        <TableHeader>
            <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
            <TableHead className="text-xs font-medium text-[#737373] py-3"><input type="checkbox" onChange={(e) => selectAll(e.target.checked)}/></TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3 pl-6">Date</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3">Store</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3">Amount</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3">Volunteer</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3">Recipient</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3">Notes</TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3"></TableHead>
            <TableHead className="text-xs font-medium text-[#737373] py-3"></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {filteredData.length > 0 ? (
            filteredData.map((d, i) => (
                <TableRow key={d.id} className="border-[#e2e8f0] hover:bg-[#fafafa]">
                    <TableCell><input type="checkbox" onChange={(e) => selectThisBox(i)} checked={selectedBoxes[i]}/></TableCell>
                <TableCell className="text-sm text-[#525252] py-3 pl-6">
                    {new Date(d.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm font-medium text-[#0a0a0a] py-3">
                    
                    {d.store}<br/>
                    <span className="text-[#a3a3a3]">{d.type}</span>
                    </TableCell>
                <TableCell className="py-3">
                    <span className="text-[#166534] text-xs font-semibold px-2.5 py-1 rounded-full">
                    ${d.amount}
                    </span>
                </TableCell>
                <TableCell className="text-sm text-[#525252] py-3">{d.volunteer}</TableCell>
                <TableCell className="text-sm text-[#525252] py-3">{d.recipient}</TableCell>
                <TableCell className="text-sm text-[#a3a3a3] py-3">{d.notes}</TableCell>
                <TableCell className="text-sm text-[#a3a3a3] py-3">
                    <button><HugeiconsIcon icon={PaintBrush01Icon} strokeWidth={2} className="size-4" /></button>
                </TableCell>
                <TableCell className="text-sm text-[#a3a3a3] py-3">
                    <button><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" /></button>
                </TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[#737373] text-sm">
                No donations found matching your filters.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
        </div>
    )
}

export default DonationsTable;