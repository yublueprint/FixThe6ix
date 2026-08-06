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
            <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-medium text-muted-foreground py-3"><input type="checkbox" onChange={(e) => selectAll(e.target.checked)}/></TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-6">Date</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Store</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Amount</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Volunteer</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Recipient</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Notes</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3"></TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3"></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {filteredData.length > 0 ? (
            filteredData.map((d, i) => (
                <TableRow key={d.id} className="border-border hover:bg-muted/50">
                    <TableCell><input type="checkbox" onChange={(e) => selectThisBox(i)} checked={!!selectedBoxes[i]}/></TableCell>
                <TableCell className="text-sm text-muted-foreground py-3 pl-6">
                    {new Date(d.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground py-3">
                    
                    {d.giftCard?.store?.name ?? "Unknown Store"}<br/>
                    <span className="text-muted-foreground">{"DONATION_OUT"}</span>
                    </TableCell>
                <TableCell className="py-3">
                    <span className="text-green-600 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    ${d.amount}
                    </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.volunteerName}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.recipientName}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.notes}</TableCell>
                <TableCell className="text-sm text-muted-foreground hover:text-blue-500 transition-colors py-3">
                    <button><HugeiconsIcon icon={PaintBrush01Icon} strokeWidth={2} className="size-4" /></button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground hover:text-red-500 transition-colors py-3">
                    <button><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" /></button>
                </TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
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